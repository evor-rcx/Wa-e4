// Bluetooth ESC/POS Print Helper untuk GPPOS & Epson TM

const ESC = 0x1b;
const GS = 0x1d;

function textToBytes(text: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    bytes.push(text.charCodeAt(i) & 0xff);
  }
  return bytes;
}

function buildReceipt(data: {
  orderId: string;
  tanggal: string;
  idPel: string;
  nama: string;
  items: { label: string; value: string; harga?: number }[];
  total: string;
  paymentStatus: string;
}): Uint8Array {
  const lines: number[] = [];

  const push = (text: string) => lines.push(...textToBytes(text + '\n'));
  const pushLine = () => push('--------------------------------');

  // Init printer
  lines.push(ESC, 0x40); // Reset
  lines.push(ESC, 0x61, 0x01); // Center align

  // Header
  lines.push(ESC, 0x45, 0x01); // Bold ON
  push('E4 STORE');
  lines.push(ESC, 0x45, 0x00); // Bold OFF
  push('Jl. Zamrud Depan Zamrud 2 RT 42');
  push('WA: 6285169949218');
  pushLine();

  // Left align
  lines.push(ESC, 0x61, 0x00);

  push(`Order ID  : #${data.orderId}`);
  push(`Tanggal   : ${data.tanggal}`);
  push(`ID Pel    : ${data.idPel}`);
  push(`Nama      : ${data.nama}`);
  pushLine();

  // Items
  for (const item of data.items) {
    if (item.harga) {
      push(`${item.label}`);
      push(`  Rp ${Number(item.harga).toLocaleString('id-ID')}`);
    } else if (item.value) {
      push(`${item.label}: ${item.value}`);
    }
  }
  pushLine();

  push(`Total     : Rp ${data.total}`);
  push(`Status    : ${data.paymentStatus}`);
  pushLine();

  // Center footer
  lines.push(ESC, 0x61, 0x01);
  push('Terima kasih!');
  push('E4 Store');

  // Feed & cut
  lines.push(GS, 0x56, 0x42, 0x00); // Cut paper

  return new Uint8Array(lines);
}

export async function printViaBluetooth(data: {
  orderId: string;
  tanggal: string;
  idPel: string;
  nama: string;
  items: { label: string; value: string; harga?: number }[];
  total: string;
  paymentStatus: string;
}): Promise<void> {
  try {
    // @ts-ignore
    if (!navigator.bluetooth) {
      alert('Bluetooth tidak didukung. Pastikan pakai APK, bukan browser biasa.');
      return;
    }

    // @ts-ignore
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });

    // @ts-ignore
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

    const receiptBytes = buildReceipt(data);

    // Kirim per 20 bytes (BLE limit)
    const chunkSize = 20;
    for (let i = 0; i < receiptBytes.length; i += chunkSize) {
      const chunk = receiptBytes.slice(i, i + chunkSize);
      await characteristic.writeValue(chunk);
      await new Promise(r => setTimeout(r, 50));
    }

    alert('Print berhasil!');
  } catch (e: any) {
    console.error(e);
    alert('Gagal print: ' + e.message);
  }
}
