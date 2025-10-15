export interface Activity {
    id: string;
    name: string;
    icon: string;
    qty: number;
  }
  
  export const activities: Activity[] = [
    { id: 'A', name: 'Psicologia', icon: 'messageCircle', qty: 0 },
    { id: 'B', name: 'Psiquiatria', icon: 'brainCircuit', qty: 0 },
    { id: 'C', name: 'Neuropsicologia', icon: 'brainCog', qty: 0 },
    { id: 'D', name: 'Psicanálise', icon: 'brain', qty: 0 },
    { id: 'E', name: 'Terapia Ocupacional', icon: 'palette', qty: 0 },
    { id: 'F', name: 'Psicopedagogia', icon: 'graduationCap', qty: 0 }
  ];