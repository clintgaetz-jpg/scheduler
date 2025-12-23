const fs = require('fs');
let c = fs.readFileSync('src/components/AppointmentDetail/index.jsx', 'utf8');

// 1. Make modal full screen
c = c.replace(
  'w-full max-w-4xl max-h-[90vh]',
  'w-full h-full max-w-[95vw] max-h-[95vh]'
);

// 2. Remove padding from outer container
c = c.replace(
  'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4',
  'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2'
);

fs.writeFileSync('src/components/AppointmentDetail/index.jsx', c);
console.log('Modal made larger!');