# Script helper para configurar e rodar o backend (PowerShell)
# Uso: abra o PowerShell na pasta raiz do projeto e execute:
# .\backend\run_backend.ps1

# Verifica se python está disponível
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) {
    Write-Host "Python não foi encontrado no PATH. Instale o Python 3 e habilite 'Add to PATH' durante a instalação." -ForegroundColor Red
    Write-Host "Sugestão (se tiver winget): winget install --id Python.Python.3 -e" -ForegroundColor Yellow
    exit 1
}

# Caminho do backend
$backendDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
Set-Location $backendDir

Write-Host "Instalando dependências..." -ForegroundColor Cyan
python -m pip install --upgrade pip
if (Test-Path requirements.txt) {
    python -m pip install -r requirements.txt
} else {
    Write-Host "requirements.txt não encontrado em $backendDir. Pule a instalação de dependências." -ForegroundColor Yellow
}

Write-Host "Executando seed (populando banco)..." -ForegroundColor Cyan
python seed.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "O seed falhou (exit code $LASTEXITCODE). Verifique a saída acima para detalhes." -ForegroundColor Red
} else {
    Write-Host "Seed executado com sucesso." -ForegroundColor Green
}

Write-Host "Iniciando servidor uvicorn (CTRL+C para parar)..." -ForegroundColor Cyan
Write-Host "Se preferir iniciar manualmente, use: python -m uvicorn app:app --reload" -ForegroundColor Yellow
python -m uvicorn app:app --reload
