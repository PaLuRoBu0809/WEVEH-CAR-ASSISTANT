-- RF-CTA-02 y RF-DAT-01: quien entra por primera vez con Google acepta la política en la pantalla "Antes de entrar"
alter table consentimiento drop constraint consentimiento_medio_check;
alter table consentimiento
  add constraint consentimiento_medio_check check (medio in ('APP_REGISTRO', 'APP_NUEVA_VERSION', 'APP_GOOGLE'));
