import os
import glob
from pypdf import PdfReader

pdf_files = glob.glob(r"c:\Users\sLyGhosT\tarot\Astroloji\*.pdf")
output_file = r"c:\Users\sLyGhosT\tarot\Astroloji\extracted_content.txt"

def extract():
    with open(output_file, "w", encoding="utf-8") as f:
        for pdf_path in sorted(pdf_files):
            filename = os.path.basename(pdf_path)
            f.write(f"\n\n{'='*40}\nFILE: {filename}\n{'='*40}\n")
            try:
                reader = PdfReader(pdf_path)
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        f.write(text + "\n")
            except Exception as e:
                f.write(f"Error reading {filename}: {e}\n")
    print(f"Extracted all text to {output_file}")

if __name__ == "__main__":
    extract()
