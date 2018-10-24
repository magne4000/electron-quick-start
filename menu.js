const { Menu } = require('electron');

const template = [
  {
    label: 'Test',
    submenu: [
      {
        label: 'Ctrl+-',
        accelerator: 'CmdOrCtrl+-',
        click() {
          console.log('Ctrl+-')
        }
      },
      {
        label: 'Ctrl++',
        accelerator: 'CmdOrCtrl+Plus',
        click() {
          console.log('Ctrl++')
        }
      },
      {
        label: 'Ctrl+[',
        accelerator: 'CmdOrCtrl+[',
        click() {
          console.log('Ctrl+[')
        }
      },
      {
        label: 'Ctrl+]',
        accelerator: 'CmdOrCtrl+]',
        click() {
          console.log('Ctrl+]')
        }
      },
    ]
  },
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));
