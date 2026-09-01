# Azure Deployment Guide for `JavaMicro` App Service

This guide provides step-by-step instructions to deploy your **AI-Powered Industrial Visual Inspection & Quality Management System** directly to your Azure Web App **`JavaMicro`** (`javamicro-evbcf4ajazckhmaa.centralindia-01.azurewebsites.net`).

---

## Method 1: Azure Portal Zip Deploy (Fastest & Easiest)

1. Open your project folder `C:\Users\prakash\Desktop\Java Micro`.
2. Select all files and folders inside `Java Micro` (`public`, `server.js`, `package.json`, `web.config`).
3. Right-click and choose **Compress to ZIP file** (name it `deploy.zip` or `app.zip`).
4. In your web browser, open the Azure Kudu Advanced Tools for your web app:
   ```
   https://javamicro-evbcf4ajazckhmaa.scm.centralindia-01.azurewebsites.net/ZipDeployUI
   ```
   *(Or in Azure Portal: Go to your `JavaMicro` Web App &rarr; Scroll down left menu to **Advanced Tools** &rarr; Click **Go** &rarr; Tools &rarr; Zip Push Deploy).*
5. Drag and drop your `deploy.zip` file onto the `/site/wwwroot` folder in the browser.
6. Kudu will automatically unpack and deploy the files.
7. Open `https://javamicro-evbcf4ajazckhmaa.centralindia-01.azurewebsites.net` to view your live site!

---

## Method 2: VS Code Azure App Service Extension

1. In VS Code, install the **Azure App Service** extension (by Microsoft).
2. Click on the Azure icon on the left activity bar and sign in to your Azure account.
3. Under **App Services**, locate `JavaMicro` (under subscription `Azure for Students` and resource group `aivisual`).
4. Right-click on `JavaMicro` &rarr; Click **Deploy to Web App...**.
5. Select the `Java Micro` workspace folder.
6. When prompted, confirm the deployment. VS Code will upload and deploy the application.

---

## Method 3: Azure CLI (Command Line)

Run the following command in PowerShell inside `c:\Users\prakash\Desktop\Java Micro`:

```powershell
# Compress project files into deploy.zip
Compress-Archive -Path public, server.js, package.json, web.config -DestinationPath deploy.zip -Force

# Deploy zip package to Azure App Service
az webapp deploy --resource-group aivisual --name JavaMicro --src-path deploy.zip --type zip
```

---

## Local Verification

To run and test locally on your computer before deploying:

1. Open PowerShell in `c:\Users\prakash\Desktop\Java Micro`:
   ```powershell
   npm install
   npm start
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```
3. Or simply double-click `public/index.html` to open it in any web browser directly.
