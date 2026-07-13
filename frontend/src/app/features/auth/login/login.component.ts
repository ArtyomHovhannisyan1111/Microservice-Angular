import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService, Lang } from '../../../core/services/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  template: `
    <div class="login-root" [class.light]="!theme.isDark()">

      <!-- Animated mesh background -->
      <div class="mesh-bg"></div>

      <!-- Orbs -->
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>

      <!-- Grid overlay -->
      <div class="grid-overlay"></div>

      <!-- Controls: top-right corner -->
      <div class="page-controls">
        <!-- Lang switcher -->
        <div class="ctrl-pill">
          @for (lang of langs; track lang.code) {
            <button class="ctrl-lang-btn"
                    [class.active]="langSvc.current() === lang.code"
                    (click)="langSvc.setLang(lang.code)">
              <span>{{ lang.flag }}</span>
              <span class="ctrl-lang-label">{{ lang.label }}</span>
            </button>
          }
        </div>
        <!-- Theme toggle -->
        <button class="ctrl-theme-btn" (click)="theme.toggle()">
          @if (theme.isDark()) {
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
            </svg>
          } @else {
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            </svg>
          }
        </button>
      </div>

      <!-- Card -->
      <div class="card" [class.shake]="shaking()">

        <!-- Top glow line -->
        <div class="card-glow-line"></div>

        <!-- Logo -->
        <div class="logo-wrap">
          <div class="logo-ring">
            <svg class="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
          </div>
          <div class="logo-pulse"></div>
        </div>

        <h1 class="title">{{ 'AUTH.WELCOME' | translate }}</h1>
        <p class="subtitle">{{ 'AUTH.LOGIN_SUBTITLE' | translate }}</p>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" autocomplete="off">

          <!-- Email field -->
          <div class="field" [class.focused]="emailFocused" [class.has-error]="f['email'].invalid && f['email'].touched">
            <label class="field-label">{{ 'AUTH.EMAIL' | translate }}</label>
            <div class="field-wrap">
              <svg class="field-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <input formControlName="email" type="email" placeholder="you@example.com"
                     class="field-input"
                     (focus)="emailFocused = true"
                     (blur)="emailFocused = false">
              <div class="field-line"></div>
            </div>
            @if (f['email'].invalid && f['email'].touched) {
              <p class="field-error">{{ 'AUTH.INVALID_EMAIL' | translate }}</p>
            }
          </div>

          <!-- Password field -->
          <div class="field" [class.focused]="pwdFocused" [class.has-error]="f['password'].invalid && f['password'].touched">
            <div class="field-top">
              <label class="field-label">{{ 'AUTH.PASSWORD' | translate }}</label>
              <a routerLink="/auth/forgot-password" class="forgot-link">{{ 'AUTH.FORGOT_PASSWORD' | translate }}</a>
            </div>
            <div class="field-wrap">
              <svg class="field-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <input formControlName="password"
                     [type]="showPwd() ? 'text' : 'password'"
                     [placeholder]="'AUTH.MIN_6_CHARS' | translate"
                     class="field-input pr-10"
                     (focus)="pwdFocused = true"
                     (blur)="pwdFocused = false">
              <button type="button" class="eye-btn" (click)="togglePwd()">
                @if (showPwd()) {
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                } @else {
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                }
              </button>
              <div class="field-line"></div>
            </div>
            @if (f['password'].invalid && f['password'].touched) {
              <p class="field-error">{{ 'AUTH.MIN_6_CHARS' | translate }}</p>
            }
          </div>

          <!-- Error banner -->
          @if (error()) {
            <div class="error-banner">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ error() }}
            </div>
          }

          <!-- Submit -->
          <button type="submit" class="submit-btn" [disabled]="loading() || form.invalid">
            <span class="submit-bg"></span>
            <span class="submit-content">
              @if (loading()) {
                <svg class="spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ 'AUTH.LOGGING_IN' | translate }}
              } @else {
                {{ 'AUTH.LOGIN_BTN' | translate }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              }
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="divider">
          <span class="divider-line"></span>
          <span class="divider-text">{{ 'AUTH.NO_ACCOUNT' | translate }}</span>
          <span class="divider-line"></span>
        </div>

        <a routerLink="/auth/register" class="register-link">{{ 'AUTH.REGISTER_LINK' | translate }}</a>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    /* ─── Root ──────────────────────────────────────────────────── */
    .login-root {
      position: fixed; inset: 0; z-index: 50;
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
      overflow: hidden;
    }

    /* ─── Mesh background ───────────────────────────────────────── */
    .mesh-bg {
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 20% 30%, rgba(99,102,241,.35) 0%, transparent 60%),
        radial-gradient(ellipse 60% 80% at 80% 70%, rgba(168,85,247,.3) 0%, transparent 60%),
        radial-gradient(ellipse 100% 100% at 50% 50%, #0a0a1a 0%, #06061a 100%);
      animation: meshShift 18s ease-in-out infinite alternate;
    }
    @keyframes meshShift {
      0%   { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(30deg); }
    }

    /* ─── Orbs ──────────────────────────────────────────────────── */
    .orb {
      position: absolute; border-radius: 50%;
      filter: blur(70px); animation: drift 25s ease-in-out infinite;
    }
    .orb-1 {
      width: 480px; height: 480px;
      background: radial-gradient(circle, rgba(99,102,241,.5), rgba(168,85,247,.2));
      top: -150px; left: -150px; animation-delay: 0s;
    }
    .orb-2 {
      width: 350px; height: 350px;
      background: radial-gradient(circle, rgba(6,182,212,.4), rgba(59,130,246,.15));
      bottom: -100px; right: -100px; animation-delay: -8s;
    }
    .orb-3 {
      width: 280px; height: 280px;
      background: radial-gradient(circle, rgba(236,72,153,.35), rgba(244,63,94,.1));
      top: 50%; left: 5%; animation-delay: -16s;
    }
    @keyframes drift {
      0%,100% { transform: translate(0,0) scale(1); }
      25%      { transform: translate(40px,-40px) scale(1.08); }
      50%      { transform: translate(-20px,30px) scale(.95); }
      75%      { transform: translate(30px,20px) scale(1.04); }
    }

    /* ─── Grid overlay ──────────────────────────────────────────── */
    .grid-overlay {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    /* ─── Card ──────────────────────────────────────────────────── */
    .card {
      position: relative; z-index: 10;
      width: 100%; max-width: 420px;
      background: rgba(255,255,255,.06);
      backdrop-filter: blur(32px);
      -webkit-backdrop-filter: blur(32px);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 28px;
      padding: 2.5rem 2.25rem;
      box-shadow:
        0 0 0 1px rgba(99,102,241,.15),
        0 32px 64px rgba(0,0,0,.5),
        0 0 80px rgba(99,102,241,.06),
        inset 0 1px 0 rgba(255,255,255,.12);
      animation: cardIn .6s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes cardIn {
      from { opacity:0; transform: translateY(32px) scale(.97); }
      to   { opacity:1; transform: translateY(0) scale(1); }
    }
    .card.shake {
      animation: shake .5s cubic-bezier(.36,.07,.19,.97) both;
    }
    @keyframes shake {
      10%,90%  { transform: translateX(-2px); }
      20%,80%  { transform: translateX(4px); }
      30%,50%,70% { transform: translateX(-6px); }
      40%,60%  { transform: translateX(6px); }
    }

    /* Top glow line */
    .card-glow-line {
      position: absolute; top: 0; left: 10%; right: 10%; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(139,92,246,.8), rgba(99,102,241,.8), transparent);
      border-radius: 100%;
    }

    /* ─── Logo ──────────────────────────────────────────────────── */
    .logo-wrap {
      position: relative;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1.5rem;
    }
    .logo-ring {
      width: 64px; height: 64px; border-radius: 18px;
      background: linear-gradient(135deg, rgba(99,102,241,.3), rgba(168,85,247,.2));
      border: 1px solid rgba(139,92,246,.4);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 30px rgba(139,92,246,.2), inset 0 1px 0 rgba(255,255,255,.15);
      animation: logoFloat 4s ease-in-out infinite;
    }
    .logo-icon { width: 28px; height: 28px; color: #a78bfa; }
    .logo-pulse {
      position: absolute; width: 64px; height: 64px; border-radius: 18px;
      border: 1px solid rgba(139,92,246,.3);
      animation: pulse 2.5s ease-out infinite;
    }
    @keyframes logoFloat {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-5px); }
    }
    @keyframes pulse {
      0%   { transform: scale(1);   opacity:.6; }
      100% { transform: scale(1.7); opacity:0; }
    }

    /* ─── Titles ────────────────────────────────────────────────── */
    .title {
      text-align: center; font-size: 1.5rem; font-weight: 700;
      color: #fff; letter-spacing: -.02em; margin: 0 0 .25rem;
    }
    .subtitle {
      text-align: center; font-size: .875rem; color: rgba(255,255,255,.45);
      margin: 0 0 2rem;
    }

    /* ─── Fields ────────────────────────────────────────────────── */
    .field { margin-bottom: 1.25rem; }
    .field-top { display: flex; align-items: center; justify-content: space-between; }
    .field-label {
      display: block; font-size: .78rem; font-weight: 500;
      color: rgba(255,255,255,.55); margin-bottom: .5rem;
      transition: color .2s;
    }
    .field.focused .field-label { color: #a78bfa; }
    .field.has-error .field-label { color: #f87171; }

    .field-wrap { position: relative; }
    .field-icon {
      position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
      width: 15px; height: 15px; color: rgba(255,255,255,.3);
      transition: color .2s; pointer-events: none;
    }
    .field.focused .field-icon { color: #a78bfa; }
    .field.has-error .field-icon { color: #f87171; }

    .field-input {
      width: 100%; padding: .75rem 1rem .75rem 2.75rem;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 14px;
      color: #fff; font-size: .875rem;
      outline: none;
      transition: border-color .25s, background .25s, box-shadow .25s;
    }
    .field-input::placeholder { color: rgba(255,255,255,.22); }
    .field-input.pr-10 { padding-right: 3rem; }

    .field.focused .field-input {
      border-color: rgba(139,92,246,.6);
      background: rgba(255,255,255,.09);
      box-shadow: 0 0 0 3px rgba(139,92,246,.15), 0 2px 8px rgba(0,0,0,.2);
    }
    .field.has-error .field-input {
      border-color: rgba(248,113,113,.5);
      box-shadow: 0 0 0 3px rgba(248,113,113,.1);
    }

    /* Animated bottom line */
    .field-line {
      position: absolute; bottom: 0; left: 10%; right: 10%; height: 1px;
      background: linear-gradient(90deg, transparent, #8b5cf6, transparent);
      transform: scaleX(0); transition: transform .3s ease;
      border-radius: 1px;
    }
    .field.focused .field-line { transform: scaleX(1); }

    /* Eye button */
    .eye-btn {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      width: 28px; height: 28px; border: none; background: none;
      color: rgba(255,255,255,.35); cursor: pointer; padding: 0;
      display: flex; align-items: center; justify-content: center;
      transition: color .2s;
    }
    .eye-btn:hover { color: rgba(255,255,255,.7); }
    .eye-btn svg { width: 17px; height: 17px; }

    .forgot-link {
      font-size: .75rem; color: rgba(255,255,255,.4);
      text-decoration: none; transition: color .2s;
      margin-bottom: .5rem; display: block;
    }
    .forgot-link:hover { color: #a78bfa; }

    /* Field error text */
    .field-error {
      font-size: .72rem; color: #f87171;
      margin: .35rem 0 0; padding-left: .25rem;
      display: flex; align-items: center; gap: .3rem;
    }

    /* ─── Error banner ──────────────────────────────────────────── */
    .error-banner {
      display: flex; align-items: flex-start; gap: .625rem;
      padding: .875rem 1rem; margin-bottom: 1rem;
      border-radius: 14px;
      background: rgba(239,68,68,.12);
      border: 1px solid rgba(239,68,68,.3);
      color: #fca5a5; font-size: .82rem; line-height: 1.5;
      animation: errIn .3s ease both;
    }
    @keyframes errIn {
      from { opacity:0; transform: translateY(-6px); }
      to   { opacity:1; transform: translateY(0); }
    }

    /* ─── Submit button ─────────────────────────────────────────── */
    .submit-btn {
      position: relative; width: 100%;
      padding: .875rem 1.5rem; margin-top: .5rem;
      border: none; border-radius: 14px; cursor: pointer;
      overflow: hidden; transition: transform .2s, box-shadow .2s;
    }
    .submit-btn:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(99,102,241,.4);
    }
    .submit-btn:active:not(:disabled) { transform: translateY(0); }
    .submit-btn:disabled { opacity: .45; cursor: not-allowed; transform: none !important; }

    .submit-bg {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
      background-size: 200% 200%;
      animation: gradBtn 4s ease infinite;
    }
    @keyframes gradBtn {
      0%,100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }

    .submit-content {
      position: relative; z-index: 1;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      font-size: .9rem; font-weight: 600; color: #fff; letter-spacing: .01em;
    }

    /* ─── Divider & register link ───────────────────────────────── */
    .divider {
      display: flex; align-items: center; gap: .75rem;
      margin: 1.5rem 0 1rem;
    }
    .divider-line {
      flex: 1; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
    }
    .divider-text { font-size: .72rem; color: rgba(255,255,255,.3); white-space: nowrap; }

    .register-link {
      display: block; text-align: center;
      font-size: .85rem; font-weight: 500;
      color: rgba(255,255,255,.6);
      text-decoration: none; padding: .5rem;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,.08);
      transition: all .2s;
    }
    .register-link:hover {
      color: #fff;
      border-color: rgba(139,92,246,.4);
      background: rgba(139,92,246,.1);
    }

    /* ─── Controls: top-right ──────────────────────────────────── */
    .page-controls {
      position: absolute; top: 1.25rem; right: 1.25rem;
      display: flex; align-items: center; gap: .5rem; z-index: 20;
    }

    /* Glass pill for lang buttons */
    .ctrl-pill {
      display: flex; align-items: center; gap: 2px;
      background: rgba(255,255,255,.12);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,.2);
      border-radius: 10px;
      padding: 3px;
    }
    .ctrl-lang-btn {
      display: flex; align-items: center; gap: 4px;
      padding: 4px 8px; border: none; border-radius: 7px;
      font-size: .72rem; font-weight: 600; cursor: pointer;
      color: rgba(255,255,255,.55);
      background: transparent;
      transition: all .15s;
    }
    .ctrl-lang-btn:hover { color: rgba(255,255,255,.9); background: rgba(255,255,255,.08); }
    .ctrl-lang-btn.active {
      background: rgba(255,255,255,.22);
      color: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,.25);
    }
    .ctrl-lang-label { display: none; }
    @media (min-width: 480px) { .ctrl-lang-label { display: inline; } }

    /* Theme toggle button */
    .ctrl-theme-btn {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      border: none; border-radius: 10px; cursor: pointer;
      background: rgba(255,255,255,.12);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,.2);
      color: rgba(255,255,255,.85);
      transition: all .15s;
    }
    .ctrl-theme-btn:hover {
      background: rgba(255,255,255,.2);
      color: #fff;
      transform: rotate(15deg);
    }

    /* Light mode overrides for controls */
    .login-root.light .ctrl-pill {
      background: rgba(99,102,241,.1);
      border-color: rgba(99,102,241,.25);
    }
    .login-root.light .ctrl-lang-btn { color: rgba(75,85,99,.6); }
    .login-root.light .ctrl-lang-btn:hover { color: #4f46e5; background: rgba(99,102,241,.1); }
    .login-root.light .ctrl-lang-btn.active {
      background: rgba(99,102,241,.18);
      color: #4f46e5;
    }
    .login-root.light .ctrl-theme-btn {
      background: rgba(99,102,241,.1);
      border-color: rgba(99,102,241,.25);
      color: #4f46e5;
    }
    .login-root.light .ctrl-theme-btn:hover { background: rgba(99,102,241,.2); color: #4338ca; }

    /* ─── Utilities ─────────────────────────────────────────────── */
    .spin { animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ─── Light mode ────────────────────────────────────────────── */
    .login-root.light .mesh-bg {
      background:
        radial-gradient(ellipse 80% 60% at 20% 30%, rgba(99,102,241,.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 80% at 80% 70%, rgba(168,85,247,.1) 0%, transparent 60%),
        radial-gradient(ellipse 100% 100% at 50% 50%, #f5f3ff 0%, #ede9fe 100%);
    }
    .login-root.light .orb-1 { background: radial-gradient(circle, rgba(99,102,241,.18), rgba(168,85,247,.08)); }
    .login-root.light .orb-2 { background: radial-gradient(circle, rgba(6,182,212,.12), rgba(59,130,246,.06)); }
    .login-root.light .orb-3 { background: radial-gradient(circle, rgba(236,72,153,.1), rgba(244,63,94,.04)); }
    .login-root.light .grid-overlay {
      background-image:
        linear-gradient(rgba(99,102,241,.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99,102,241,.05) 1px, transparent 1px);
    }
    .login-root.light .card {
      background: rgba(255,255,255,.88);
      border-color: rgba(99,102,241,.18);
      box-shadow:
        0 0 0 1px rgba(99,102,241,.08),
        0 32px 64px rgba(99,102,241,.12),
        inset 0 1px 0 rgba(255,255,255,.9);
    }
    .login-root.light .card-glow-line {
      background: linear-gradient(90deg, transparent, rgba(99,102,241,.5), rgba(139,92,246,.5), transparent);
    }
    .login-root.light .title { color: #1e1b4b; }
    .login-root.light .subtitle { color: rgba(75,85,99,.7); }
    .login-root.light .field-label { color: rgba(75,85,99,.9); }
    .login-root.light .field.focused .field-label { color: #6366f1; }
    .login-root.light .field.has-error .field-label { color: #ef4444; }
    .login-root.light .field-input {
      background: rgba(255,255,255,.9);
      border-color: rgba(99,102,241,.2);
      color: #1e1b4b;
    }
    .login-root.light .field-input::placeholder { color: rgba(107,114,128,.45); }
    .login-root.light .field.focused .field-input {
      border-color: rgba(99,102,241,.5);
      background: #fff;
      box-shadow: 0 0 0 3px rgba(99,102,241,.1), 0 2px 8px rgba(0,0,0,.06);
    }
    .login-root.light .field.has-error .field-input {
      border-color: rgba(239,68,68,.4);
      box-shadow: 0 0 0 3px rgba(239,68,68,.08);
    }
    .login-root.light .field-icon { color: rgba(107,114,128,.45); }
    .login-root.light .field.focused .field-icon { color: #6366f1; }
    .login-root.light .field.has-error .field-icon { color: #ef4444; }
    .login-root.light .eye-btn { color: rgba(107,114,128,.45); }
    .login-root.light .eye-btn:hover { color: #6366f1; }
    .login-root.light .forgot-link { color: rgba(107,114,128,.65); }
    .login-root.light .forgot-link:hover { color: #6366f1; }
    .login-root.light .divider-text { color: rgba(107,114,128,.65); }
    .login-root.light .divider-line {
      background: linear-gradient(90deg, transparent, rgba(99,102,241,.2), transparent);
    }
    .login-root.light .register-link {
      color: rgba(75,85,99,.75);
      border-color: rgba(99,102,241,.15);
    }
    .login-root.light .register-link:hover {
      color: #6366f1;
      border-color: rgba(99,102,241,.35);
      background: rgba(99,102,241,.05);
    }
    .login-root.light .logo-ring {
      background: linear-gradient(135deg, rgba(99,102,241,.15), rgba(168,85,247,.1));
      border-color: rgba(99,102,241,.3);
    }
    .login-root.light .logo-icon { color: #6366f1; }
    .login-root.light .logo-pulse { border-color: rgba(99,102,241,.25); }
  `]
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  readonly theme  = inject(ThemeService);
  readonly langSvc = inject(LanguageService);

  readonly langs: { code: Lang; label: string; flag: string }[] = [
    { code: 'ru', label: 'RU', flag: '🇷🇺' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'hy', label: 'ՀՅ', flag: '🇦🇲' }
  ];

  readonly loading  = signal(false);
  readonly error    = signal('');
  readonly showPwd  = signal(false);
  readonly shaking  = signal(false);

  emailFocused = false;
  pwdFocused   = false;

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get f() { return this.form.controls; }

  togglePwd(): void { this.showPwd.update(v => !v); }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.form.getRawValue() as { email: string; password: string });
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/catalog';
      await this.router.navigateByUrl(returnUrl);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка входа';
      this.error.set(msg);
      this.shaking.set(true);
      setTimeout(() => this.shaking.set(false), 600);
    } finally {
      this.loading.set(false);
    }
  }
}
