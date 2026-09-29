"use client";

import { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { RegionResponse, LocationResponse, StationResponse, RouterOnboardRequest, RouterValidationResponse } from "@/lib/types/network";
import { validateRouterConnectivity, onboardRouter } from "@/actions/network";
import { listCompanies, type CompanySummary } from "@/actions/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Cpu, Server, MapPin, Settings, CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, Loader2, AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";

interface OnboardingWizardProps {
  regionsTree: RegionResponse[];
  companyScope?: string | null;
  isPlatformAdmin?: boolean;
}

export function OnboardingWizard({ regionsTree, companyScope, isPlatformAdmin }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [hardwareProfile, setHardwareProfile] = useState<RouterValidationResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<LocationResponse[]>([]);
  const [filteredStations, setFilteredStations] = useState<StationResponse[]>([]);

  const [wizardData, setWizardData] = useState({
    ipAddress: "",
    port: 8728,
    username: "",
    password: "",
    regionIdxno: "",
    locationIdxno: "",
    stationIdxno: "",
    routerRole: "PPPOE",
    pppoeEnabled: true,
    hotspotEnabled: false,
    monitoringEnabled: true,
    companyCode: companyScope || "",
  });
  const [companies, setCompanies] = useState<CompanySummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    listCompanies().then((rows) => {
      if (cancelled) return;
      const allowed = companyScope ? rows.filter((row) => row.code === companyScope) : rows;
      setCompanies(allowed);
      setWizardData((current) => ({
        ...current,
        companyCode: current.companyCode || allowed[0]?.code || "",
      }));
    });
    return () => { cancelled = true; };
  }, [companyScope]);

  const validateStep1 = async (values: {
  ipAddress: string;
  port: number;
  username: string;
  password: string;
}) => {
    setIsVerifying(true);
    try {
      const res = await validateRouterConnectivity({
        ipAddress: values.ipAddress,
        port: Number(values.port),
        username: values.username,
        password: values.password,
      });

 if (res.success && res.data) {
 setHardwareProfile(res.data);
 setWizardData((prev) => ({ ...prev, ...values }));
 toast.success("Hardware validated successfully!");
 setStep(2);
 } else {
 toast.error(res.message || "Failed to connect to router.");
 }
} catch {
  toast.error("Network validation error occurred.");
  } finally {
 setIsVerifying(false);
 }
 };

const handleOnboard = async () => {
    // Busy-lock: prevent duplicate router allocation/onboarding POSTs when an
    // operator double-clicks during server-action latency.
    if (isOnboarding) return;

    setIsOnboarding(true);
    try {
      const payload: RouterOnboardRequest = {
        ipAddress: wizardData.ipAddress.trim(),
        port: Number(wizardData.port) || 8728,
        username: wizardData.username.trim(),
        password: wizardData.password,
        stationIdxno: Number(wizardData.stationIdxno),
        routerRole: wizardData.routerRole,
        pppoeEnabled: Boolean(wizardData.pppoeEnabled),
        hotspotEnabled: Boolean(wizardData.hotspotEnabled),
        monitoringEnabled: Boolean(wizardData.monitoringEnabled),
        companyCode: wizardData.companyCode,
        routerName: hardwareProfile?.identity?.trim() || undefined,
      };

      const res = await onboardRouter(payload);
      if (res.success) {
        toast.success("Router onboarded and linked successfully!");
        router.push("/network/stations");
      } else {
        // Surfaces server-action errors, including the apiFetch token
        // short-circuit (401 returned without any backend dispatch).
        toast.error(res.message || "Failed to onboard router. Please verify your session.");
        if (res.status === 401) {
          toast.error("Session expired. Please sign out and sign back in.");
        }
      }
    } catch {
      toast.error("Unexpected failure saving profile.");
    } finally {
      setIsOnboarding(false);
    }
  };

 return (
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <Card className="md:col-span-1 border-border bg-card">
 <CardContent className="p-4 space-y-4 pt-6">
 {[
 { id: 1, label: "Connectivity", icon: Server },
 { id: 2, label: "Validation", icon: Cpu },
 { id: 3, label: "Assignment", icon: MapPin },
 { id: 4, label: "Role & Services", icon: Settings },
 { id: 5, label: "Summary", icon: ShieldCheck },
 ].map((s) => {
 const Icon = s.icon;
 return (
 <div
 key={s.id}
 className={`flex items-center gap-3 p-2 rounded-lg text-sm font-medium ${
 step === s.id
 ? "bg-primary/10 text-primary"
 : "text-muted-foreground"
 }`}
 >
 <Icon className="h-4 w-4" />
 <span>{s.label}</span>
 </div>
 );
 })}
 </CardContent>
 </Card>

 <Card className="md:col-span-3 border-border">
 <CardContent className="p-6">

 {step === 1 && (
 <Formik
 initialValues={{
 ipAddress: wizardData.ipAddress,
 port: wizardData.port,
 username: wizardData.username,
 password: wizardData.password,
 }}
 validationSchema={Yup.object({
 ipAddress: Yup.string().required("IP Address/Host is required"),
 port: Yup.number().required().min(1).max(65535),
 username: Yup.string().required("Username is required"),
 password: Yup.string().required("Password is required"),
 })}
 onSubmit={validateStep1}
 >
 {({ errors, touched }) => (
 <Form className="space-y-4">
 <div className="space-y-1">
 <h3 className="text-lg font-normal">1. Device Connectivity</h3>
 <p className="text-sm text-muted-foreground">Enter connection parameters to establish a raw TCP RouterOS API socket connection.</p>
 </div>

 <div className="grid grid-cols-3 gap-4">
 <div className="col-span-2 space-y-2">
 <Label htmlFor="ipAddress">IP Address / Domain</Label>
 <Field as={Input} id="ipAddress" name="ipAddress" placeholder="192.168.88.1" />
 {errors.ipAddress && touched.ipAddress && <div className="text-xs text-destructive">{errors.ipAddress}</div>}
 </div>
 <div className="space-y-2">
 <Label htmlFor="port">API Port</Label>
 <Field as={Input} id="port" name="port" type="number" />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="username">Username</Label>
 <Field as={Input} id="username" name="username" placeholder="admin" />
 {errors.username && touched.username && <div className="text-xs text-destructive">{errors.username}</div>}
 </div>

 <div className="space-y-2">
 <Label htmlFor="password">Password</Label>
 <Field as={Input} id="password" name="password" type="password" />
 {errors.password && touched.password && <div className="text-xs text-destructive">{errors.password}</div>}
 </div>

 <div className="flex justify-end pt-4">
 <Button type="submit" disabled={isVerifying} className="flex items-center gap-2">
 {isVerifying ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" /> Verifying Connection...
 </>
 ) : (
 <>
 Next <ChevronRight className="h-4 w-4" />
 </>
 )}
 </Button>
 </div>
 </Form>
 )}
 </Formik>
 )}

 {step === 2 && hardwareProfile && (
 <div className="space-y-4">
 <div className="space-y-1">
 <h3 className="text-lg font-normal text-green-500 flex items-center gap-2">
 <CheckCircle2 className="h-5 w-5" /> Hardware Discovered & Verified
 </h3>
 <p className="text-sm text-muted-foreground">The platform queried RouterOS and successfully read these parameters.</p>
 </div>

 <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border text-sm font-medium">
 <div><span className="text-muted-foreground block text-xs">Device Identity</span> {hardwareProfile.identity}</div>
 <div><span className="text-muted-foreground block text-xs">Model Number</span> {hardwareProfile.model}</div>
 <div><span className="text-muted-foreground block text-xs">CPU Architecture</span> {hardwareProfile.architecture}</div>
 <div><span className="text-muted-foreground block text-xs">RouterOS version</span> {hardwareProfile.routerosVersion}</div>
 <div><span className="text-muted-foreground block text-xs">Serial Number</span> {hardwareProfile.serialNumber}</div>
 <div><span className="text-muted-foreground block text-xs">Total Memory</span> {(Number(hardwareProfile.totalMemory)/(1024*1024)).toFixed(0)} MB</div>
 </div>

 <div className="flex justify-between pt-4">
 <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4" /> Back</Button>
 <Button onClick={() => setStep(3)}>Next <ChevronRight className="h-4 w-4" /></Button>
 </div>
 </div>
 )}

          {step === 3 && (
            <Formik
              initialValues={{
                regionIdxno: wizardData.regionIdxno,
                locationIdxno: wizardData.locationIdxno,
                stationIdxno: wizardData.stationIdxno,
              }}
              validationSchema={Yup.object({
                regionIdxno: Yup.number().required("Region is required"),
                locationIdxno: Yup.number().required("Location is required"),
                stationIdxno: Yup.number().required("Station POP is required"),
              })}
              onSubmit={(values) => {
                setWizardData((prev) => ({ ...prev, ...values }));
                setStep(4);
              }}
            >
              {({ errors, touched, values, setFieldValue }) => {
                // eslint-disable-next-line react-hooks/rules-of-hooks -- Formik render-prop callbacks are top-level hook calls in this pattern
                useEffect(() => {
                  if (values.regionIdxno) {
                    const selReg = regionsTree.find(r => r.idxno === Number(values.regionIdxno));
                    setFilteredLocations(selReg?.locations || []);
                    setFieldValue("locationIdxno", "");
                    setFieldValue("stationIdxno", "");
                  } else {
                    setFilteredLocations([]);
                    setFilteredStations([]);
                  }
                }, [values.regionIdxno, setFieldValue]);

                // eslint-disable-next-line react-hooks/rules-of-hooks -- Formik render-prop callbacks are top-level hook calls in this pattern
                useEffect(() => {
                  if (values.locationIdxno) {
                    const selLoc = filteredLocations.find(l => l.idxno === Number(values.locationIdxno));
                    setFilteredStations(selLoc?.stations || []);
                    setFieldValue("stationIdxno", "");
                  } else {
                    setFilteredStations([]);
                  }
                }, [values.locationIdxno, setFieldValue]);

 const hasRegions = regionsTree.length > 0;

 return (
 <Form className="space-y-4">
<div className="space-y-1">
  <h3 className="text-lg font-normal">3. Network Assignment</h3>
  <p className="text-sm text-muted-foreground">Assign this router to a physical geographic Point of Presence (POP).</p>
  </div>

  <div className="space-y-2">
  <Label htmlFor="companyCode">Operating Company</Label>
  {isPlatformAdmin ? (
  <Field as="select" id="companyCode" name="companyCode" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
  {companies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
  </Field>
  ) : (
  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
  {(companies.find(c => c.code === wizardData.companyCode)?.name ?? wizardData.companyCode) || "Unavailable"}
  <span className="ml-2 text-xs">— locked to your login scope</span>
  </div>
  )}
  <p className="text-xs text-muted-foreground">
  {isPlatformAdmin
  ? "Super-admin override. The router is bound to this company for naming, billing, and M-Pesa paybill resolution."
  : "Your account is scoped to this company. Routers you onboard are automatically bound to it."}
  </p>
  </div>

  {!hasRegions && (
 <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
 <div className="flex items-start gap-3">
 <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
 <div className="space-y-1">
 <h4 className="font-normal text-sm">No ISP Station POPs configured</h4>
 <p className="text-xs text-muted-foreground leading-relaxed">
 A MikroTik router must be assigned to an active Station POP for billing and revenue attribution. Create a Region → Location → Station before onboarding a router.
 </p>
 <Link
 href="/network/stations"
 className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 transition"
 >
 <Plus className="h-3.5 w-3.5" /> Create Station POP
 </Link>
 </div>
 </div>
 </div>
 )}

 <div className="space-y-2">
 <Label htmlFor="regionIdxno">Geographic Region</Label>
 <Field as="select" id="regionIdxno" name="regionIdxno" disabled={!hasRegions} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
 <option value="">
 {hasRegions ? "Select Region..." : "No stations available — create a Region → Location → Station first"}
 </option>
 {regionsTree.map(r => <option key={r.idxno} value={r.idxno}>{r.name}</option>)}
 </Field>
 {errors.regionIdxno && touched.regionIdxno && <div className="text-xs text-destructive">{errors.regionIdxno}</div>}
 {!hasRegions && (
 <p className="text-xs text-amber-500">
 Create a region with locations and stations before onboarding a router.
 </p>
 )}
 </div>

 <div className="space-y-2">
 <Label htmlFor="locationIdxno">Location / Area</Label>
 <Field as="select" id="locationIdxno" name="locationIdxno" disabled={!values.regionIdxno || filteredLocations.length === 0} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
 <option value="">
 {!values.regionIdxno
 ? "Select a region first..."
 : filteredLocations.length === 0
 ? "No locations in this region — create one first"
 : "Select Location..."}
 </option>
 {filteredLocations.map(l => <option key={l.idxno} value={l.idxno}>{l.name}</option>)}
 </Field>
 {errors.locationIdxno && touched.locationIdxno && <div className="text-xs text-destructive">{errors.locationIdxno}</div>}
 {values.regionIdxno && filteredLocations.length === 0 && (
 <p className="text-xs text-amber-500">
 No locations found for this region. Create a location first.
 </p>
 )}
 </div>

 <div className="space-y-2">
 <Label htmlFor="stationIdxno">Onboard Station POP</Label>
 <Field as="select" id="stationIdxno" name="stationIdxno" disabled={!values.locationIdxno || filteredStations.length === 0} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
 <option value="">
 {!values.locationIdxno
 ? "Select a location first..."
 : filteredStations.length === 0
 ? "No stations in this location — create one first"
 : "Select POP..."}
 </option>
 {filteredStations.map(s => <option key={s.idxno} value={s.idxno}>{s.name}</option>)}
 </Field>
 {errors.stationIdxno && touched.stationIdxno && <div className="text-xs text-destructive">{errors.stationIdxno}</div>}
 {values.locationIdxno && filteredStations.length === 0 && (
 <p className="text-xs text-amber-500">
 No stations found for this location. Create a station first.
 </p>
 )}
 </div>

 <div className="flex justify-between pt-4">
 <Button type="button" variant="outline" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4" /> Back</Button>
 <Button type="submit" disabled={!hasRegions}>Next <ChevronRight className="h-4 w-4" /></Button>
 </div>
 </Form>
 );
 }}
 </Formik>
 )}

 {step === 4 && (
 <Formik
 initialValues={{
 routerRole: wizardData.routerRole,
 pppoeEnabled: wizardData.pppoeEnabled,
 hotspotEnabled: wizardData.hotspotEnabled,
 monitoringEnabled: wizardData.monitoringEnabled,
 }}
 onSubmit={(values) => {
 setWizardData((prev) => ({ ...prev, ...values }));
 setStep(5);
 }}
 >
 {() => (
 <Form className="space-y-4">
 <div className="space-y-1">
 <h3 className="text-lg font-normal">4. Device Role & Capabilities</h3>
 <p className="text-sm text-muted-foreground">Select device performance constraints and core services to provision.</p>
 </div>

 <div className="space-y-2">
 <Label htmlFor="routerRole">Primary Router Role</Label>
 <Field as="select" id="routerRole" name="routerRole" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
 <option value="CORE">CORE (L3 Gateway / Border)</option>
 <option value="DISTRIBUTION">DISTRIBUTION (Mid-mile aggregation)</option>
 <option value="PPPOE">PPPOE BROADBAND ACCESS</option>
 <option value="HOTSPOT">CAPTIVE PORTAL ACCESS</option>
 </Field>
 </div>

 <div className="space-y-4 border-t pt-4">
 <div className="flex items-center justify-between">
 <div>
 <Label className="font-semibold block">Enable PPPoE Server</Label>
 <span className="text-xs text-muted-foreground">Authorize standard home router PPPoE broadband sessions.</span>
 </div>
 <Field type="checkbox" name="pppoeEnabled" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
 </div>

 <div className="flex items-center justify-between border-t pt-4">
 <div>
 <Label className="font-semibold block">Enable Captive Portal Hotspot</Label>
 <span className="text-xs text-muted-foreground">Enable browser authentication redirection and vouchers.</span>
 </div>
 <Field type="checkbox" name="hotspotEnabled" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
 </div>

 <div className="flex items-center justify-between border-t pt-4">
 <div>
 <Label className="font-semibold block">Continuous Telmetry Monitoring</Label>
 <span className="text-xs text-muted-foreground">Poll device CPU/memory/traffic status via SNMP/API every 30s.</span>
 </div>
 <Field type="checkbox" name="monitoringEnabled" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
 </div>
 </div>

 <div className="flex justify-between pt-4">
 <Button type="button" variant="outline" onClick={() => setStep(3)}><ChevronLeft className="h-4 w-4" /> Back</Button>
 <Button type="submit">Next <ChevronRight className="h-4 w-4" /></Button>
 </div>
 </Form>
 )}
 </Formik>
 )}

 {step === 5 && (
 <div className="space-y-4">
 <div className="space-y-1">
 <h3 className="text-lg font-normal">5. Topology Registration Confirmation</h3>
 <p className="text-sm text-muted-foreground">Verify connection parameters and hardware signatures before finalizing alignment.</p>
 </div>

<div className="grid grid-cols-2 gap-4 border p-4 bg-muted/20 rounded-lg text-sm">
  <div><span className="text-muted-foreground block text-xs">Device IP Endpoint</span> {wizardData.ipAddress}:{wizardData.port}</div>
  <div><span className="text-muted-foreground block text-xs">Interrogation User</span> {wizardData.username}</div>
  <div><span className="text-muted-foreground block text-xs">Device Role Constraint</span> {wizardData.routerRole}</div>
  <div><span className="text-muted-foreground block text-xs">Assigned Station POP</span> Station ID #{wizardData.stationIdxno}</div>
  <div><span className="text-muted-foreground block text-xs">Operating Company</span> {(companies.find(c => c.code === wizardData.companyCode)?.name ?? wizardData.companyCode) || "Unavailable"}</div>
  <div><span className="text-muted-foreground block text-xs">PPPoE Enabled</span> {wizardData.pppoeEnabled ? "Yes" : "No"}</div>
  <div><span className="text-muted-foreground block text-xs">Hotspot Captive Portal</span> {wizardData.hotspotEnabled ? "Yes" : "No"}</div>
  </div>

<div className="flex justify-between pt-4">
  <Button variant="outline" onClick={() => setStep(4)}><ChevronLeft className="h-4 w-4" /> Back</Button>
  <Button
  type="button"
  onClick={handleOnboard}
  disabled={isOnboarding}
  className="flex items-center gap-2"
  >
  {isOnboarding ? (
  <>
  <Loader2 className="h-4 w-4 animate-spin" /> Onboarding Router...
  </>
  ) : (
  <>
  <CheckCircle2 className="h-4 w-4" /> Complete Onboarding
  </>
  )}
  </Button>
  </div>
 </div>
 )}

 </CardContent>
 </Card>
 </div>
 );
}