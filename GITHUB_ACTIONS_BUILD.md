# GitHub Actions build

1. Create an empty GitHub repository.
2. Upload all files from this archive into the repository root.
3. Open the repository on GitHub.
4. Go to Actions -> Build Windows Installer -> Run workflow.
5. Wait for the build to finish.
6. Open the finished workflow run and download the `PARSER-Windows-Installer` artifact.

The installer file will be inside the artifact archive, usually in `dist-electron/*.exe`.

To make the website download it, upload the installer to the server as:

```bash
/root/fresko-panel/releases/PARSER-Setup.exe
```

The website route is already prepared:

```text
/api/download/desktop
```
