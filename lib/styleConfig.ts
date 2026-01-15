import { mongoClientPromise } from "./mongo";

export type StyleConfig = {
  branding: {
    siteName: string;
    logoDataUrl?: string; // webp or svg data url
    address: {
      country?: string;
      province?: string;
      city?: string;
      street?: string;
      number?: string;
      floor?: string;
      apartment?: string;
      postalCode?: string;
    };
    socials: {
      whatsapp?: string;
      facebook?: string;
      x?: string;
      instagram?: string;
      youtube?: string;
    };
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    links: string;
    linksHover: string;
  };
  borders: {
    borderWidth: number;
    borderRadius: number;
  };
  sections: {
    showLocations: boolean;
    showSpecialties: boolean;
  };
  updatedAt: string; // ISO
};

const DB_NAME = process.env.MONGO_DATABASE || "kober_shifts";
const COLLECTION = "style_config";
const DOC_ID = "default";

export async function getStyleConfig(): Promise<StyleConfig> {
  const fallback: StyleConfig = {
    branding: {
      siteName: "Kober Shifts",
      address: {},
      socials: {},
    },
    colors: {
      primary: "#1976d2",
      secondary: "#9c27b0",
      accent: "#00bcd4",
      background: "#ffffff",
      text: "#171717",
      links: "#1976d2",
      linksHover: "#115293",
    },
    borders: {
      borderWidth: 1,
      borderRadius: 12,
    },
    sections: {
      showLocations: false,
      showSpecialties: true,
    },
    updatedAt: new Date().toISOString(),
  };

  let doc: Partial<StyleConfig> | null = null;
  
  try {
    const client = await mongoClientPromise;
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);
    doc = (await col.findOne({ _id: DOC_ID })) as Partial<StyleConfig> | null;
  } catch (error) {
    console.error("Error connecting to MongoDB for style-config:", error);
    // Continue with doc = null to use fallback config
  }

  const merged: StyleConfig = {
    ...fallback,
    ...(doc ?? {}),
    branding: {
      ...fallback.branding,
      ...(doc?.branding ?? {}),
      address: {
        ...fallback.branding.address,
        ...(doc?.branding?.address ?? {}),
      },
      socials: {
        ...fallback.branding.socials,
        ...(doc?.branding?.socials ?? {}),
      },
    },
    colors: {
      ...fallback.colors,
      ...(doc?.colors ?? {}),
    },
    borders: {
      ...fallback.borders,
      ...(doc?.borders ?? {}),
    },
    sections: {
      ...fallback.sections,
      ...(doc?.sections ?? {}),
    },
  };

  return merged;
}

export async function upsertStyleConfig(input: Partial<StyleConfig>): Promise<StyleConfig> {
  try {
    const client = await mongoClientPromise;
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    const prev = await getStyleConfig();
    const nextDoc: StyleConfig = {
      ...prev,
      ...input,
      branding: {
        ...prev.branding,
        ...(input.branding ?? {}),
        address: {
          ...prev.branding.address,
          ...(input.branding?.address ?? {}),
        },
        socials: {
          ...prev.branding.socials,
          ...(input.branding?.socials ?? {}),
        },
      },
      colors: {
        ...prev.colors,
        ...(input.colors ?? {}),
      },
      borders: {
        ...prev.borders,
        ...(input.borders ?? {}),
      },
      sections: {
        ...prev.sections,
        ...(input.sections ?? {}),
      },
      updatedAt: new Date().toISOString(),
    };

    await col.updateOne(
      { _id: DOC_ID },
      { $set: { ...nextDoc, _id: DOC_ID } },
      { upsert: true },
    );

    return nextDoc;
  } catch (error) {
    console.error("Error upserting style-config to MongoDB:", error);
    // If MongoDB is unavailable, return the merged config anyway
    // (it won't be persisted, but at least the API won't fail)
    const prev = await getStyleConfig();
    const nextDoc: StyleConfig = {
      ...prev,
      ...input,
      branding: {
        ...prev.branding,
        ...(input.branding ?? {}),
        address: {
          ...prev.branding.address,
          ...(input.branding?.address ?? {}),
        },
        socials: {
          ...prev.branding.socials,
          ...(input.branding?.socials ?? {}),
        },
      },
      colors: {
        ...prev.colors,
        ...(input.colors ?? {}),
      },
      borders: {
        ...prev.borders,
        ...(input.borders ?? {}),
      },
      sections: {
        ...prev.sections,
        ...(input.sections ?? {}),
      },
      updatedAt: new Date().toISOString(),
    };
    return nextDoc;
  }
}


