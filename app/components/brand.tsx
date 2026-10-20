import Image from "next/image";

type WorkshopProfile = {
  businessName: string;
  ownerName: string;
  ownerRole: "Owner / Administrator";
  location: string;
  logoPath: string;
  contact: {
    telephone: string | null;
    whatsapp: string | null;
    email: string | null;
    streetAddress: string | null;
    vatNumber: string | null;
    labourRate: string | null;
  };
};

/** Confirmed JB Motors identity. Null contact fields await owner confirmation and must not be invented. */
export const WORKSHOP_PROFILE: WorkshopProfile = {
  businessName: "JB Motors",
  ownerName: "Jabulani",
  ownerRole: "Owner / Administrator",
  location: "Ratanda, Heidelberg, Gauteng (GP)",
  logoPath: "/brand/jb-motors-logo.png",
  contact: { telephone: null, whatsapp: null, email: null, streetAddress: null, vatNumber: null, labourRate: null },
};

export function BrandLockup({ compact = false, dark = true }: { compact?: boolean; dark?: boolean }) {
  return (
    <div className={`brand-lockup ${compact ? "compact" : ""} ${dark ? "on-dark" : "on-light"}`} aria-label={`${WORKSHOP_PROFILE.businessName} logo`}>
      <Image className="brand-logo-image" src={WORKSHOP_PROFILE.logoPath} alt="JB Motors" width={510} height={184} priority />
    </div>
  );
}
