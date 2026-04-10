import tkinter as tk
from tkinter import filedialog, messagebox
import fitz  # PyMuPDF
from PIL import Image, ImageTk
from deep_translator import GoogleTranslator
import os

class TradutorPDF:
    def __init__(self, root):
        self.root = root
        self.root.title("Tradutor Minimalista")
        self.root.geometry("1300x900")
        self.root.configure(bg="#ffffff")

        self.pdf_document = None
        self.current_page = 0
        self.zoom = 2.0
        self.translation_font_size = 13
        self.selection_rect = None
        self.start_x = None
        self.start_y = None
        self.image_tk = None
        self.translator = GoogleTranslator(source='auto', target='pt')

        self.setup_ui()

    def setup_ui(self):
        # Modern Look: Colors and Fonts
        self.bg_color = "#ffffff"
        self.accent_color = "#3498db"
        self.text_color = "#2c3e50"
        self.sidebar_color = "#f8f9fa"
        self.font_main = ("Helvetica", 10)
        self.font_title = ("Helvetica", 12, "bold")

        # Top Control Bar (Unified for both sides)
        self.top_bar = tk.Frame(self.root, bg=self.bg_color, pady=10, bd=0)
        self.top_bar.pack(side=tk.TOP, fill=tk.X)

        # PDF Controls (Left aligned in Top Bar)
        self.open_btn = tk.Button(self.top_bar, text="Abrir PDF", command=self.load_pdf, 
                                 relief=tk.FLAT, bg=self.accent_color, fg="white", 
                                 font=self.font_main, padx=15, pady=5)
        self.open_btn.pack(side=tk.LEFT, padx=(20, 10))

        # PDF Navigation
        self.prev_btn = tk.Button(self.top_bar, text="←", command=self.prev_page, 
                                 relief=tk.FLAT, bg="#eee", font=self.font_main, padx=8)
        self.prev_btn.pack(side=tk.LEFT, padx=2)

        self.page_label = tk.Label(self.top_bar, text="0 / 0", bg=self.bg_color, font=self.font_main)
        self.page_label.pack(side=tk.LEFT, padx=10)

        self.next_btn = tk.Button(self.top_bar, text="→", command=self.next_page, 
                                 relief=tk.FLAT, bg="#eee", font=self.font_main, padx=8)
        self.next_btn.pack(side=tk.LEFT, padx=2)

        # PDF Zoom
        tk.Label(self.top_bar, text="Zoom:", bg=self.bg_color, font=self.font_main).pack(side=tk.LEFT, padx=(20, 5))
        self.zoom_out_btn = tk.Button(self.top_bar, text="-", command=self.zoom_pdf_out, 
                                     relief=tk.FLAT, bg="#eee", font=self.font_main, padx=10)
        self.zoom_out_btn.pack(side=tk.LEFT, padx=2)
        
        self.zoom_in_btn = tk.Button(self.top_bar, text="+", command=self.zoom_pdf_in, 
                                    relief=tk.FLAT, bg="#eee", font=self.font_main, padx=10)
        self.zoom_in_btn.pack(side=tk.LEFT, padx=2)

        # Separator Line
        tk.Frame(self.root, height=1, bg="#e0e0e0").pack(fill=tk.X)

        # Main PanedWindow
        self.paned_window = tk.PanedWindow(self.root, orient=tk.HORIZONTAL, sashwidth=4, bg="#e0e0e0", bd=0)
        self.paned_window.pack(fill=tk.BOTH, expand=True)

        # Left Frame (PDF)
        self.left_container = tk.Frame(self.paned_window, bg=self.bg_color)
        self.paned_window.add(self.left_container, width=850)

        self.canvas_container = tk.Frame(self.left_container, bg="#dbdbdb")
        self.canvas_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.canvas = tk.Canvas(self.canvas_container, bg="#dbdbdb", highlightthickness=0)
        self.vbar = tk.Scrollbar(self.canvas_container, orient=tk.VERTICAL, command=self.canvas.yview)
        self.hbar = tk.Scrollbar(self.canvas_container, orient=tk.HORIZONTAL, command=self.canvas.xview)
        self.canvas.configure(yscrollcommand=self.vbar.set, xscrollcommand=self.hbar.set)
        
        self.vbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.hbar.pack(side=tk.BOTTOM, fill=tk.X)
        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.canvas.bind("<Button-1>", self.on_start_selection)
        self.canvas.bind("<B1-Motion>", self.on_move_selection)
        self.canvas.bind("<ButtonRelease-1>", self.on_finish_selection)

        # Right Frame (Translation)
        self.right_frame = tk.Frame(self.paned_window, bg=self.sidebar_color, padx=20, pady=20)
        self.paned_window.add(self.right_frame, width=450)

        # Header with Font Controls
        self.header_right = tk.Frame(self.right_frame, bg=self.sidebar_color)
        self.header_right.pack(fill=tk.X, pady=(0, 10))

        self.translation_label = tk.Label(self.header_right, text="Tradução", 
                                         bg=self.sidebar_color, fg=self.accent_color, 
                                         font=self.font_title)
        self.translation_label.pack(side=tk.LEFT)

        self.font_inc_btn = tk.Button(self.header_right, text="A+", command=self.increase_font, 
                                     relief=tk.FLAT, bg="#eee", font=self.font_main, padx=5)
        self.font_inc_btn.pack(side=tk.RIGHT, padx=2)

        self.font_dec_btn = tk.Button(self.header_right, text="A-", command=self.decrease_font, 
                                     relief=tk.FLAT, bg="#eee", font=self.font_main, padx=5)
        self.font_dec_btn.pack(side=tk.RIGHT, padx=2)

        self.translation_text = tk.Text(self.right_frame, wrap=tk.WORD, 
                                       font=("Georgia", self.translation_font_size),
                                       bg=self.sidebar_color, fg=self.text_color,
                                       relief=tk.FLAT, highlightthickness=0,
                                       padx=5, pady=5)
        self.translation_text.pack(fill=tk.BOTH, expand=True)

        
        tk.Frame(self.right_frame, height=1, bg="#e0e0e0").pack(fill=tk.X, pady=10)

    def load_pdf(self):
        file_path = filedialog.askopenfilename(
            title="Selecionar Documento PDF",
            filetypes=[("Arquivos PDF", "*.pdf")]
        )
        if file_path:
            self.pdf_document = fitz.open(file_path)
            self.current_page = 0
            self.display_page()

    def display_page(self):
        if not self.pdf_document:
            return

        page = self.pdf_document[self.current_page]
        mat = fitz.Matrix(self.zoom, self.zoom)
        pix = page.get_pixmap(matrix=mat)
        
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        self.image_tk = ImageTk.PhotoImage(img)
        
        self.canvas.delete("all")
        self.canvas.create_image(0, 0, anchor=tk.NW, image=self.image_tk)
        self.canvas.config(scrollregion=(0, 0, pix.width, pix.height))
        
        self.page_label.config(text=f"{self.current_page + 1} / {len(self.pdf_document)}")
        self.selection_rect = None

    def prev_page(self):
        if self.pdf_document and self.current_page > 0:
            self.current_page -= 1
            self.display_page()
            self.canvas.yview_moveto(0)

    def next_page(self):
        if self.pdf_document and self.current_page < len(self.pdf_document) - 1:
            self.current_page += 1
            self.display_page()
            self.canvas.yview_moveto(0)

    def zoom_pdf_in(self):
        self.zoom += 0.2
        self.display_page()

    def zoom_pdf_out(self):
        if self.zoom > 0.4:
            self.zoom -= 0.2
            self.display_page()

    def increase_font(self):
        self.translation_font_size += 1
        self.translation_text.configure(font=("Georgia", self.translation_font_size))

    def decrease_font(self):
        if self.translation_font_size > 8:
            self.translation_font_size -= 1
            self.translation_text.configure(font=("Georgia", self.translation_font_size))

    def on_start_selection(self, event):
        self.start_x = self.canvas.canvasx(event.x)
        self.start_y = self.canvas.canvasy(event.y)
        if self.selection_rect:
            self.canvas.delete(self.selection_rect)
        self.selection_rect = self.canvas.create_rectangle(
            self.start_x, self.start_y, self.start_x, self.start_y, 
            outline="#3498db", width=2
        )

    def on_move_selection(self, event):
        cur_x = self.canvas.canvasx(event.x)
        cur_y = self.canvas.canvasy(event.y)
        self.canvas.coords(self.selection_rect, self.start_x, self.start_y, cur_x, cur_y)

    def on_finish_selection(self, event):
        end_x = self.canvas.canvasx(event.x)
        end_y = self.canvas.canvasy(event.y)
        
        pdf_x0 = min(self.start_x, end_x) / self.zoom
        pdf_y0 = min(self.start_y, end_y) / self.zoom
        pdf_x1 = max(self.start_x, end_x) / self.zoom
        pdf_y1 = max(self.start_y, end_y) / self.zoom
        
        rect = fitz.Rect(pdf_x0, pdf_y0, pdf_x1, pdf_y1)
        
        if self.pdf_document:
            page = self.pdf_document[self.current_page]
            text = page.get_text("text", clip=rect).strip()
            
            if text:
                self.translate_and_display(text)

    def translate_and_display(self, text):
        try:
            # Clean text
            cleaned_text = text.replace('-\n', '').replace('\n', ' ')
            import re
            cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()

            if not cleaned_text:
                return

            self.translation_text.delete(1.0, tk.END)
            self.translation_text.insert(tk.END, "Processando tradução...")
            self.root.update_idletasks()

            # The API has a limit (usually ~5000 chars)
            # We'll split the text into chunks of 4000 to be safe
            max_chars = 4000
            chunks = []
            
            # Simple recursive-like splitting by sentence or character limit
            remaining_text = cleaned_text
            while len(remaining_text) > max_chars:
                # Find the last period or space within the limit to not break words
                split_at = remaining_text.rfind('. ', 0, max_chars)
                if split_at == -1:
                    split_at = remaining_text.rfind(' ', 0, max_chars)
                if split_at == -1:
                    split_at = max_chars
                
                chunks.append(remaining_text[:split_at + 1].strip())
                remaining_text = remaining_text[split_at + 1:].strip()
            
            if remaining_text:
                chunks.append(remaining_text)

            # Translate each chunk
            translated_parts = []
            total_chunks = len(chunks)
            
            for i, chunk in enumerate(chunks):
                if total_chunks > 1:
                    self.translation_text.delete(1.0, tk.END)
                    self.translation_text.insert(tk.END, f"Traduzindo parte {i+1} de {total_chunks}...")
                    self.root.update_idletasks()
                
                part_translation = self.translator.translate(chunk)
                translated_parts.append(part_translation)

            full_translation = " ".join(translated_parts)
            
            self.translation_text.delete(1.0, tk.END)
            self.translation_text.insert(tk.END, full_translation)
            
            self.translation_text.tag_add("all", "1.0", tk.END)
            self.translation_text.tag_configure("all", justify=tk.LEFT)
            
        except Exception as e:
            self.translation_text.delete(1.0, tk.END)
            self.translation_text.insert(tk.END, f"Erro: {str(e)}")


if __name__ == "__main__":
    root = tk.Tk()
    app = TradutorPDF(root)
    root.mainloop()
