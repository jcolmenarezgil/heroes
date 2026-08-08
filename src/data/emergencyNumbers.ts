export interface EmergencyContact {
    id: string;
    category: "general" | "police" | "medical" | "fire" | "civilProtection";
    label: string;
    number: string;
}

export interface CountryData {
    code: string; // ISO 3166-1 alpha-2
    name: string;
    contacts: EmergencyContact[];
}

export const EMERGENCY_DIRECTORIES: Record<string, CountryData> = {
    VE: {
        code: "VE",
        name: "Venezuela",
        contacts: [
            { id: "ve-gen", category: "general", label: "Central de Emergencias", number: "911" },
            { id: "ve-pol", category: "police", label: "CICPC (Desapariciones)", number: "0800-2427224" },
            { id: "ve-cp", category: "civilProtection", label: "Protección Civil", number: "0800-7372283" },
        ],
    },
    CO: {
        code: "CO",
        name: "Colombia",
        contacts: [
            { id: "co-gen", category: "general", label: "Línea Única de Emergencias", number: "123" },
            { id: "co-pol", category: "police", label: "Policía Nacional", number: "112" },
            { id: "co-med", category: "medical", label: "CRUE Ambulancias", number: "125" },
            { id: "co-cp", category: "civilProtection", label: "Defensa Civil", number: "144" },
        ],
    },
    US: {
        code: "US",
        name: "United States",
        contacts: [
            { id: "us-gen", category: "general", label: "Emergency Services", number: "911" },
            { id: "us-miss", category: "police", label: "NCMEC (Missing Children)", number: "1-800-843-5678" },
            { id: "us-text", category: "general", label: "Crisis Text Line", number: "Text HOME to 741741" },
        ],
    },
};

// Fallback universal si el país no está mapeado aún
export const DEFAULT_COUNTRY_CODE = "VE";