cd /d D:\Dev\Workspaces\Active\DMForge
set GOOGLE_APPLICATION_CREDENTIALS=D:\Dev\Secrets\dmforge-1df2e-firebase-adminsdk-fbsvc-daf455ba26.json
set NODE_ENV=development
npx -y firebase-tools@latest deploy --only firestore:rules --project dmforge-1df2e --non-interactive > _fbdeploy.log 2>&1
echo EXITCODE=%errorlevel% >> _fbdeploy.log
