# Configuración Segura de Variables de Entorno

## Para Desarrollo Local

### 1. Configurar la API Key de OpenAI en Firebase Functions Config
```bash
firebase functions:config:set openai.key="tu-api-key-aqui"
```

### 2. Generar archivo de configuración local para emuladores
```bash
cd functions
firebase functions:config:get > .runtimeconfig.json
```

### 3. Verificar que `.runtimeconfig.json` está en .gitignore
El archivo `functions/.runtimeconfig.json` debe estar en `.gitignore` para evitar exponer las API keys.

### 4. Iniciar emuladores
```bash
firebase emulators:start --only functions,firestore,storage --project gressusapp
```

## Para Producción

### 1. Configurar variables de entorno
```bash
firebase functions:config:set openai.key="tu-api-key-de-produccion"
```

### 2. Desplegar funciones
```bash
firebase deploy --only functions
```

## Estructura de Configuración

Las funciones acceden a la configuración usando:
```typescript
const apiKey = functions.config().openai?.key;
```

## Archivos Importantes

- `functions/.runtimeconfig.json` - Configuración local (NO subir a git)
- `functions/src/transcribe.ts` - Función de transcripción
- `functions/src/extract.ts` - Función de extracción de datos médicos  
- `functions/src/diagnosis.ts` - Función de generación de diagnóstico

## Seguridad

✅ **Buenas prácticas aplicadas:**
- API keys no hardcodeadas en el código
- Configuración usando Firebase Functions config
- Archivo de configuración local en .gitignore
- Validación de existencia de API key al inicializar

❌ **Evitar:**
- Hardcodear API keys en el código fuente
- Subir archivos `.runtimeconfig.json` al repositorio
- Usar console.log con API keys completas

## Solución de Problemas

### Error: "OpenAI API key not configured"
1. Verificar que la API key está configurada: `firebase functions:config:get`
2. Regenerar archivo local: `firebase functions:config:get > functions/.runtimeconfig.json`
3. Reiniciar emuladores

### Error: "Functions codebase could not be analyzed"
1. Recompilar funciones: `cd functions && npm run build`
2. Verificar sintaxis en archivos TypeScript
3. Reiniciar emuladores 