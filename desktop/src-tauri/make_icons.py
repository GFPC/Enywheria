import os
import struct
import zlib

def create_png(width, height, filepath):
    # Minimal 8-bit RGBA PNG writer
    def png_chunk(chunk_type, data):
        return struct.pack('>I', len(data)) + chunk_type + data + struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_chunk = png_chunk(b'IHDR', ihdr)
    
    # Raw pixel data (indigo color: #6366f1, alpha 255)
    raw_data = bytearray()
    for _ in range(height):
        raw_data.append(0) # Filter type 0
        for _ in range(width):
            raw_data.extend([99, 102, 241, 255])
            
    idat_chunk = png_chunk(b'IDAT', zlib.compress(raw_data))
    iend_chunk = png_chunk(b'IEND', b'')
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'wb') as f:
        f.write(header + ihdr_chunk + idat_chunk + iend_chunk)

def main():
    icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
    os.makedirs(icons_dir, exist_ok=True)
    create_png(32, 32, os.path.join(icons_dir, '32x32.png'))
    create_png(128, 128, os.path.join(icons_dir, '128x128.png'))
    create_png(256, 256, os.path.join(icons_dir, '128x128@2x.png'))
    create_png(256, 256, os.path.join(icons_dir, 'icon.png'))
    # Dummy ico / icns
    with open(os.path.join(icons_dir, 'icon.ico'), 'wb') as f:
        f.write(b'\x00\x00\x01\x00\x01\x00\x01\x01\x00\x00\x01\x00\x20\x00\x00\x00\x00\x00\x00\x00\x00\x00')
    with open(os.path.join(icons_dir, 'icon.icns'), 'wb') as f:
        f.write(b'icns\x00\x00\x00\x08')
    print("Icons generated successfully!")

if __name__ == '__main__':
    main()
