const fs = require('fs');
let c = fs.readFileSync('src/components/AppointmentDetail/index.jsx', 'utf8');

// Remove the left sidebar with CustomerPanel and VehiclePanel
const oldSidebar = `{/* Left Column - Customer & Vehicle Info */}
          <div className="w-72 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto flex-shrink-0">
            <CustomerPanel 
              appointment={editedAppointment}
              onUpdate={updateField}
            />
            <div className="border-t border-gray-200 my-4" />
            <VehiclePanel 
              appointment={editedAppointment}
              onUpdate={updateField}
            />
          </div>`;

if (c.includes(oldSidebar)) {
  c = c.replace(oldSidebar, '');
  console.log('Removed sidebar!');
} else {
  console.log('Sidebar not found with exact match');
}

fs.writeFileSync('src/components/AppointmentDetail/index.jsx', c);