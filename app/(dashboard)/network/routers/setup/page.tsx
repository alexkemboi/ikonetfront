"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProvisioningStepper } from "@/components/provisioning/ProvisioningStepper";
import { Step1Identity } from "@/components/provisioning/Step1Identity";
import { Step2Script } from "@/components/provisioning/Step2Script";
import { Step3Services } from "@/components/provisioning/Step3Services";
import { Step4Done } from "@/components/provisioning/Step4Done";
import { generateZtpScript } from "@/actions/provisioning";
import { ProvisioningScriptResponse } from "@/lib/types/provisioning";

export default function RouterSetupWizardPage() {
 const router = useRouter();
 const [step, setStep] = useState(1);
 const [identity, setIdentity] = useState("");
 const [scriptData, setScriptData] = useState<ProvisioningScriptResponse | null>(null);

 async function handleIdentitySubmit(inputIdentity: string) {
 setIdentity(inputIdentity);
 const data = await generateZtpScript(inputIdentity);
 setScriptData(data);
 setStep(2);
 }

 return (
 <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
 <div className="mx-auto max-w-3xl space-y-6">
 <div>
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 NETWORK — ROUTERS
 </span>
 <h1 className="text-3xl font-sans font-normal text-foreground">Link a MikroTik.</h1>
 <p className="mt-1 text-xs text-muted-foreground">
 Register the router, paste the provisioning script on RouterOS, then choose PPPoE or Hotspot services.
 </p>
 </div>

 {/* Stepper Navigation */}
 <div className="border-y border-border py-4">
 <ProvisioningStepper currentStep={step} />
 </div>

 {/* Step Views */}
 {step === 1 && (
 <Step1Identity
 onContinue={handleIdentitySubmit}
 onCancel={() => router.push("/network/routers")}
 />
 )}

 {step === 2 && scriptData && (
 <Step2Script
 scriptData={scriptData}
 onConnected={() => setStep(3)}
 />
 )}

 {step === 3 && scriptData && (
 <Step3Services
 routerId={scriptData.routerId}
 onComplete={() => setStep(4)}
 />
 )}

 {step === 4 && <Step4Done identity={identity} />}
 </div>
 </div>
 );
}