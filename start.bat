echo off
cls
:a
node --max-old-space-size=2048 index.js
goto a