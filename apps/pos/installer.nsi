; ═══════════════════════════════════════════════════════════════
;  El Fundo POS — Installer v1.0
;  Modern UI 2 + Metro theme
; ═══════════════════════════════════════════════════════════════

Unicode True
SetCompressor zlib

; ── Metadatos ────────────────────────────────────────────────
!define PRODUCT_NAME        "El Fundo POS"
!define PRODUCT_VERSION     "1.0.0"
!define PRODUCT_PUBLISHER   "Carnicería El Fundo"
!define PRODUCT_EXE         "El Fundo POS.exe"
!define INSTALL_DIR         "$PROGRAMFILES64\El Fundo POS"
!define REG_KEY             "Software\Microsoft\Windows\CurrentVersion\Uninstall\El Fundo POS"
!define NSIS_ROOT           "C:\Users\Andres Ignacio\AppData\Local\electron-builder\Cache\nsis\nsis-3.0.4.1"
!define SRC                 "C:\ef_src"

Name          "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile       "C:\Users\Andres Ignacio\Desktop\El Fundo POS Setup 1.0.0.exe"
InstallDir    "${INSTALL_DIR}"
InstallDirRegKey HKLM "${REG_KEY}" "InstallLocation"
RequestExecutionLevel admin
ShowInstDetails show
ShowUnInstDetails show
BrandingText  "© ${PRODUCT_PUBLISHER} · v${PRODUCT_VERSION}"

; ── MUI2 ─────────────────────────────────────────────────────
!addincludedir  "${NSIS_ROOT}\Include"
!addincludedir  "${NSIS_ROOT}\Contrib\Modern UI 2"
!addplugindir   "${NSIS_ROOT}\Plugins\x86-ansi"
!include "MUI2.nsh"

; ── Apariencia Metro/Moderna ─────────────────────────────────
!define MUI_ABORTWARNING
!define MUI_ABORTWARNING_TEXT      "¿Seguro que quieres cancelar la instalación de ${PRODUCT_NAME}?"
!define ICON_PATH                  "C:\Users\Andres Ignacio\Desktop\Carniceria El Fundo\apps\pos\public\icon.ico"
!define MUI_ICON                   "${ICON_PATH}"
!define MUI_UNICON                 "${ICON_PATH}"

; ── Textos personalizados ─────────────────────────────────────
!define MUI_DIRECTORYPAGE_TEXT_TOP "Selecciona la carpeta donde instalar ${PRODUCT_NAME}.$\r$\nSe requieren aproximadamente 350 MB de espacio libre."

!define MUI_INSTFILESPAGE_PROGRESSBAR    "smooth"

!define MUI_FINISHPAGE_TITLE       "¡Instalación completada!"
!define MUI_FINISHPAGE_TEXT        "${PRODUCT_NAME} fue instalado exitosamente.$\r$\n$\r$\nTu inventario y base de datos están protegidos en:$\r$\n%APPDATA%\\El Fundo POS\\$\r$\n$\r$\nHaz clic en Terminar para cerrar este asistente."
!define MUI_FINISHPAGE_RUN         "$INSTDIR\${PRODUCT_EXE}"
!define MUI_FINISHPAGE_RUN_TEXT    "Abrir El Fundo POS ahora"
!define MUI_FINISHPAGE_RUN_NOTCHECKED
!define MUI_FINISHPAGE_LINK        "carniceriaelfundo.cl"
!define MUI_FINISHPAGE_LINK_LOCATION "https://carniceriaelfundo.cl"

; ── Páginas del instalador ───────────────────────────────────
; Sin página de bienvenida ni directorio → abre directo en progreso
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; ── Páginas del desinstalador ────────────────────────────────
!define MUI_FINISHPAGE_TITLE       "Desinstalación completada"
!define MUI_FINISHPAGE_TEXT        "${PRODUCT_NAME} fue eliminado correctamente.$\r$\n$\r$\nTu inventario sigue disponible en:$\r$\n%APPDATA%\\El Fundo POS\\"
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; ── Idioma ───────────────────────────────────────────────────
!insertmacro MUI_LANGUAGE "Spanish"

; ═══════════════════════════════════════════════════════════════
;  SECCIÓN PRINCIPAL — Instalación
; ═══════════════════════════════════════════════════════════════
Section "El Fundo POS (requerido)" SEC_MAIN
  SectionIn RO

  ; Mostrar progreso primero — luego cerrar app si corre
  DetailPrint "━━━ Iniciando instalación de El Fundo POS..."
  DetailPrint "━━━ Paso 1/5 — Cerrando instancia anterior (si está abierta)..."
  nsExec::Exec 'taskkill /F /IM "El Fundo POS.exe"'
  Sleep 300

  ; Copiar archivos de la app
  DetailPrint "━━━ Paso 2/5 — Copiando archivos de la aplicación..."
  SetOutPath "$INSTDIR"
  SetOverwrite on
  SetDetailsPrint both
  File /r "${SRC}\*.*"
  SetDetailsPrint listonly

  ; Guardar ruta de instalación
  DetailPrint "━━━ Paso 3/5 — Registrando aplicación en el sistema..."
  WriteRegStr HKLM "${REG_KEY}" "InstallLocation"  "$INSTDIR"
  WriteRegStr HKLM "${REG_KEY}" "DisplayName"      "${PRODUCT_NAME}"
  WriteRegStr HKLM "${REG_KEY}" "DisplayVersion"   "${PRODUCT_VERSION}"
  WriteRegStr HKLM "${REG_KEY}" "Publisher"        "${PRODUCT_PUBLISHER}"
  WriteRegStr HKLM "${REG_KEY}" "UninstallString"  '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKLM "${REG_KEY}" "DisplayIcon"      "$INSTDIR\${PRODUCT_EXE}"
  WriteRegDWORD HKLM "${REG_KEY}" "NoModify"       1
  WriteRegDWORD HKLM "${REG_KEY}" "NoRepair"       1
  WriteRegStr HKLM "${REG_KEY}" "EstimatedSize"    "358000"
  DetailPrint "  → Registro de Windows actualizado"

  ; Acceso directo escritorio
  DetailPrint "━━━ Paso 4/5 — Creando accesos directos..."
  CreateShortcut "$DESKTOP\${PRODUCT_NAME}.lnk" \
    "$INSTDIR\${PRODUCT_EXE}" "" \
    "$INSTDIR\${PRODUCT_EXE}" 0 SW_SHOWNORMAL \
    "" "${PRODUCT_NAME} — Sistema de caja"
  DetailPrint "  → Acceso directo en Escritorio"

  ; Menú Inicio
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" \
    "$INSTDIR\${PRODUCT_EXE}" "" \
    "$INSTDIR\${PRODUCT_EXE}" 0 SW_SHOWNORMAL \
    "" "${PRODUCT_NAME} — Sistema de caja"
  CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\Desinstalar.lnk" \
    "$INSTDIR\Uninstall.exe"
  DetailPrint "  → Acceso directo en Menú Inicio"

  ; Desinstalador
  DetailPrint "━━━ Paso 5/5 — Configurando desinstalador..."
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  DetailPrint "  → Desinstalador creado"

  DetailPrint ""
  DetailPrint "✓ El Fundo POS instalado correctamente en $INSTDIR"
SectionEnd

; ═══════════════════════════════════════════════════════════════
;  SECCIÓN DESINSTALACIÓN
; ═══════════════════════════════════════════════════════════════
Section "Uninstall"
  ; Eliminar archivos de la app (NO toca %AppData%)
  RMDir /r "$INSTDIR"

  ; Eliminar accesos directos
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\Desinstalar.lnk"
  RMDir  "$SMPROGRAMS\${PRODUCT_NAME}"

  ; Limpiar registro
  DeleteRegKey HKLM "${REG_KEY}"
  DeleteRegKey HKLM "Software\El Fundo POS"
SectionEnd
