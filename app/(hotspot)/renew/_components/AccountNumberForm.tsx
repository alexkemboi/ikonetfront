"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountNumberForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const number = value.replace(/[\s-]/g, "").toUpperCase();
  const valid = /^[A-Z0-9]{3,20}$/.test(number);

  return (
    <form
      className="mt-6 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) router.push(`/renew/${number}`);
      }}
    >
      <Label htmlFor="accountNumber">Account number</Label>
      <Input id="accountNumber" value={value} onChange={(e) => setValue(e.target.value)} placeholder="BDK0069"
        autoComplete="off" autoCapitalize="characters" inputMode="text" />
      <Button type="submit" className="w-full" disabled={!valid}>Continue</Button>
    </form>
  );
}
