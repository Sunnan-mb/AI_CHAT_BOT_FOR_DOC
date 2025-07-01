import os
import PyPDF2
import docx
from config.config import config

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in config.ALLOWED_EXTENSIONS

def read_txt(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

def read_pdf(file_path):
    text = ""
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    return text

def read_docx(file_path):
    doc = docx.Document(file_path)
    return "\n".join([paragraph.text for paragraph in doc.paragraphs])

def process_document(file):
    if not file or not allowed_file(file.filename):
        return None, "Invalid file type. Please upload a PDF, TXT, or DOCX file."
    
    try:
        # Save the file temporarily
        file_path = os.path.join(config.UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        
        # Read the file based on its extension
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        
        if file_ext == 'pdf':
            content = read_pdf(file_path)
        elif file_ext == 'docx':
            content = read_docx(file_path)
        else:  # txt
            content = read_txt(file_path)
            
        # Clean up the temporary file
        os.remove(file_path)
        
        return content, None
        
    except Exception as e:
        return None, f"Error processing file: {str(e)}"
