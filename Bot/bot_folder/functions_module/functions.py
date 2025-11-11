import functions_module.config as config
import os
import html


def get_text(filename: str, **kwargs) -> str:
    """
    Get text from the 'filename' file.\n
    If you have  in the file's text,\n
    you can add value by adding **kwags with  name:
    "variable = ..."

    :param filename:
    :type :obj:str

    :return: text from the file
    :rtype: :obj:str
    """

    filepath = os.path.join(config.TEXTS_ROOT, filename)
    if not os.path.exists:
        raise BaseException('No such file or directory')
    
    # Get text from 'filename' file
    with open(filepath, 'r', encoding='utf-8') as file:
        text = file.read()
    
    # Replace all 'kwarks' in the file's text
    for kwarg, value in kwargs.items():
        if value == None:
            value = ''
        text = text.replace(f'', str(value), 1)

    return text


def get_media(filename: str, **kwargs) -> bytes:
    """
    Get media-file (photo, video, etc.) from the 'filename' file.

    :param filename:
    :type :obj:str

    :return: Bytes of the file
    :rtype: :obj:str
    """

    filepath = os.path.join(config.MEDIA_ROOT, filename)
    if not os.path.exists:
        raise BaseException('No such file or directory')
    
    # Get bytes of the 'filename' file
    with open(filepath, 'rb') as file:
        file_bytes = file.read()

    return file_bytes


def escape_text_html(text: str) -> str:
    """
    Replace special characters "&", "<" and ">" to HTML-safe sequences.

    :param text:
    :type :obj:str

    :return: Escaped text
    :rtype: :obj:str
    """
    if text is None:
        return ''
    return html.escape(text)


def is_num(x):
    try:
        x = float(x)
        return True
    except:
        return False
    

def is_int(x):
    try:
        return float(x) == int(x)
    except:
        return False


def create_file(filename: str, 
                text: str) -> bytes:
    """
    Generate file with name = 'filename' and file-date = 'text'

    Args:
        filename (str): Name of the file
        text (str): File's text data

    Returns:
        bytes: Text file
    """

    # Write to file
    with open(filename, 'w', encoding='utf-8') as file:
        file.write(text)
    
    # Get bytes from file
    res_bytes = bytes()
    with open(filename, 'rb') as file:
        res_bytes = file.read()

    os.remove(filename)
    return res_bytes
