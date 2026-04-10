# Tradutor de PDF com Tkinter

Este aplicativo permite visualizar arquivos PDF e traduzir trechos selecionados em tempo real.

## Como Usar

1. **Ative o ambiente virtual:**
   ```bash
   source venv/bin/activate
   ```

2. **Execute o aplicativo:**
   ```bash
   python main.py
   ```

3. **Operação:**
   - Use o menu **Arquivo > Abrir PDF** para carregar um documento.
   - Use os botões **Anterior** e **Próxima** para navegar entre as páginas.
   - **Para traduzir:** Clique e arraste o mouse sobre o texto no PDF para criar um retângulo de seleção. Ao soltar o botão, a tradução aparecerá no painel à direita.

## Requisitos
As dependências já foram instaladas no seu ambiente virtual (`venv`):
- `PyMuPDF` (fitz): Manipulação de PDF.
- `Pillow`: Exibição de imagens.
- `deep-translator`: Integração com o Google Tradutor.
