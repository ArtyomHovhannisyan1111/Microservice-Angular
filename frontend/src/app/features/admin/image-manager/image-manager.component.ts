import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EMPTY, Subject, catchError, from, map, mergeMap, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ImageService } from '../../../core/services/image.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  IMAGE_CONFIG,
  ImageFolder,
  QueuedFile,
} from '../../../core/models/image.model';

@Component({
  selector:        'app-image-manager',
  standalone:      true,
  imports:         [CommonModule, TranslateModule],
  templateUrl:     './image-manager.component.html',
  styleUrl:        './image-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageManagerComponent implements OnDestroy {
  private readonly imageService = inject(ImageService);
  private readonly toast        = inject(ToastService);
  private readonly t            = inject(TranslateService);
  private readonly destroy$     = new Subject<void>();

  readonly folderLabelKeys: Record<ImageFolder, string> = {
    products:   'IMAGE_MANAGER.FOLDER_PRODUCTS',
    avatars:    'IMAGE_MANAGER.FOLDER_AVATARS',
    banners:    'IMAGE_MANAGER.FOLDER_BANNERS',
    categories: 'IMAGE_MANAGER.FOLDER_CATEGORIES',
    misc:       'IMAGE_MANAGER.FOLDER_MISC',
  };

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  readonly config         = IMAGE_CONFIG;
  readonly queue          = signal<QueuedFile[]>([]);
  readonly isDragOver     = signal(false);
  readonly selectedFolder = signal<ImageFolder>(IMAGE_CONFIG.defaultFolder);
  readonly isUploadingAll = signal(false);

  readonly pendingCount   = computed(() => this.queue().filter(f => f.status === 'pending').length);
  readonly uploadingCount = computed(() => this.queue().filter(f => f.status === 'uploading').length);
  readonly successCount   = computed(() => this.queue().filter(f => f.status === 'success').length);
  readonly errorCount     = computed(() => this.queue().filter(f => f.status === 'error').length);
  readonly totalCount     = computed(() => this.queue().length);
  readonly totalSize      = computed(() => this.queue().reduce((sum, f) => sum + f.file.size, 0));
  readonly hasFiles       = computed(() => this.queue().length > 0);
  readonly canUploadAll   = computed(() => this.pendingCount() > 0 && !this.isUploadingAll());

  // ── File input ────────────────────────────────────────────────────────────
  openFilePicker(multiple = true): void {
    const el = this.fileInputRef.nativeElement;
    el.multiple = multiple;
    el.accept   = IMAGE_CONFIG.acceptedExtensions;
    el.value    = '';
    el.click();
  }

  onFileInputChange(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files?.length) this.addFiles(Array.from(files));
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isDragOver()) this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length) this.addFiles(files);
  }

  // ── Queue management ──────────────────────────────────────────────────────
  addFiles(files: File[]): void {
    const remaining = IMAGE_CONFIG.maxFiles - this.queue().length;
    if (remaining <= 0) {
      this.toast.warning(
        this.t.instant('IMAGE_MANAGER.TOAST_QUEUE_FULL_TITLE'),
        this.t.instant('IMAGE_MANAGER.TOAST_QUEUE_FULL_BODY', { maxFiles: IMAGE_CONFIG.maxFiles })
      );
      return;
    }

    const rejected: string[] = [];
    const valid: QueuedFile[] = files
      .slice(0, remaining)
      .filter(file => {
        if (!(IMAGE_CONFIG.acceptedMimeTypes as readonly string[]).includes(file.type)) {
          rejected.push(`${file.name}: ${this.t.instant('IMAGE_MANAGER.TOAST_FORMAT_ERROR')}`);
          return false;
        }
        if (file.size > IMAGE_CONFIG.maxFileSizeBytes) {
          rejected.push(`${file.name}: ${this.t.instant('IMAGE_MANAGER.TOAST_SIZE_ERROR', { maxSize: 15 })}`);
          return false;
        }
        return true;
      })
      .map(file => ({
        id:         crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status:     'pending' as const,
        progress:   0,
      }));

    if (rejected.length) {
      this.toast.error(this.t.instant('IMAGE_MANAGER.TOAST_REJECTED_TITLE'), rejected.join('\n'));
    }
    if (valid.length) {
      this.queue.update(q => [...q, ...valid]);
    }
  }

  removeFile(id: string): void {
    const file = this.queue().find(f => f.id === id);
    if (file) URL.revokeObjectURL(file.previewUrl);
    this.queue.update(q => q.filter(f => f.id !== id));
  }

  clearCompleted(): void {
    const done = this.queue().filter(f => f.status === 'success');
    done.forEach(f => URL.revokeObjectURL(f.previewUrl));
    this.queue.update(q => q.filter(f => f.status !== 'success'));
  }

  clearAll(): void {
    this.queue().forEach(f => URL.revokeObjectURL(f.previewUrl));
    this.queue.set([]);
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  uploadFile(file: QueuedFile): void {
    this.updateFile(file.id, { status: 'uploading', progress: 0 });

    this.imageService.upload(file.file, this.selectedFolder())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: event => {
          if (event.type === 'progress') {
            this.updateFile(file.id, { progress: event.progress });
          } else {
            this.updateFile(file.id, {
              status:           'success',
              progress:         100,
              uploadedFileName: event.response.fileName,
              uploadedUrl:      this.imageService.getImageUrl(event.response.fileName),
            });
            this.toast.success(this.t.instant('IMAGE_MANAGER.TOAST_UPLOADED_TITLE'), file.file.name);
          }
        },
        error: err => this.updateFile(file.id, {
          status:       'error',
          errorMessage: err?.error?.error ?? err?.error?.message ?? this.t.instant('IMAGE_MANAGER.TOAST_UPLOAD_ERROR'),
        }),
      });
  }

  uploadAll(): void {
    const pending = this.queue().filter(f => f.status === 'pending');
    if (!pending.length) return;

    this.isUploadingAll.set(true);

    from(pending)
      .pipe(
        mergeMap(
          file =>
            this.imageService.upload(file.file, this.selectedFolder())
              .pipe(
                map(event => ({ event, id: file.id })),
                catchError(err => {
                  this.updateFile(file.id, {
                    status:       'error',
                    errorMessage: err?.error?.error ?? err?.error?.message ?? this.t.instant('IMAGE_MANAGER.TOAST_UPLOAD_ERROR'),
                  });
                  return EMPTY;
                })
              ),
          IMAGE_CONFIG.concurrentUploads
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ event, id }) => {
          if (event.type === 'progress') {
            this.updateFile(id, { progress: event.progress });
          } else {
            this.updateFile(id, {
              status:           'success',
              progress:         100,
              uploadedFileName: event.response.fileName,
              uploadedUrl:      this.imageService.getImageUrl(event.response.fileName),
            });
          }
        },
        complete: () => {
          this.isUploadingAll.set(false);
          const n = this.successCount();
          const e = this.errorCount();
          if (n > 0) {
            const bodyKey = e > 0 ? 'IMAGE_MANAGER.TOAST_DONE_ERRORS' : 'IMAGE_MANAGER.TOAST_DONE_BODY';
            this.toast.success(
              this.t.instant('IMAGE_MANAGER.TOAST_DONE_TITLE'),
              this.t.instant(bodyKey, { n, e })
            );
          }
        },
      });
  }

  retryFile(id: string): void {
    const file = this.queue().find(f => f.id === id);
    if (file) this.uploadFile({ ...file, status: 'pending', progress: 0, errorMessage: undefined });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private updateFile(id: string, patch: Partial<QueuedFile>): void {
    this.queue.update(q => q.map(f => f.id === id ? { ...f, ...patch } : f));
  }

  formatSize(bytes: number): string {
    if (bytes < 1024)      return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  }

  setFolder(folder: ImageFolder): void {
    this.selectedFolder.set(folder);
  }

  copyUrl(url: string): void {
    navigator.clipboard.writeText(url).then(() =>
      this.toast.success(
        this.t.instant('IMAGE_MANAGER.TOAST_COPIED_TITLE'),
        this.t.instant('IMAGE_MANAGER.TOAST_COPIED_BODY')
      )
    );
  }

  ngOnDestroy(): void {
    this.queue().forEach(f => URL.revokeObjectURL(f.previewUrl));
    this.destroy$.next();
    this.destroy$.complete();
  }
}
