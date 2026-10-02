"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateBuyerPrompts } from "@/lib/prompts/generate";
import { INTENT_LABELS, type PromptIntent } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Competitor = { name: string; domain: string };
type PromptDraft = { text: string; intent: PromptIntent };

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { name: "", domain: "" },
    { name: "", domain: "" },
  ]);
  const [prompts, setPrompts] = useState<PromptDraft[]>([]);
  const [busy, setBusy] = useState(false);

  function nextFromBrand() {
    if (name.length < 2 || domain.length < 3 || category.length < 2 || description.length < 10) {
      toast.error("Fill name, domain, category, and a short description.");
      return;
    }
    setStep(2);
  }

  function nextFromCompetitors() {
    const filled = competitors.filter((item) => item.name && item.domain).slice(0, 5);
    if (filled.length === 0) {
      toast.error("Add at least one competitor.");
      return;
    }
    setPrompts(
      generateBuyerPrompts({
        brandName: name,
        category,
        competitors: filled.map((item) => item.name),
      }),
    );
    setStep(3);
  }

  async function finish() {
    setBusy(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        domain,
        category,
        description,
        competitors: competitors.filter((item) => item.name && item.domain).slice(0, 5),
        prompts,
      }),
    });
    const data = (await res.json()) as { id?: string; error?: string };
    setBusy(false);
    if (!res.ok || !data.id) {
      toast.error(data.error || "Could not create brand");
      return;
    }
    toast.success("Brand ready");
    router.push("/prompts");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="mb-6 text-[22px] font-bold tracking-tight">redlify</p>
      <h1 className="text-4xl font-bold">Add a brand</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Step {step} of 3. Then we generate 20 buyer prompts you can edit.
      </p>
      <Card className="mt-8 rounded-xl">
        <CardContent className="space-y-4 py-6">
          {step === 1 ? (
            <>
              <Field label="Brand name" value={name} onChange={setName} />
              <Field label="Domain" value={domain} onChange={setDomain} placeholder="acme.example" />
              <Field label="Category" value={category} onChange={setCategory} placeholder="AI meeting intelligence" />
              <div>
                <Label>Description</Label>
                <Textarea className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <Button className="rounded-xl" onClick={nextFromBrand}>
                Continue
              </Button>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <p className="text-sm text-muted-foreground">Up to 5 fictional or real competitors.</p>
              {competitors.map((item, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) =>
                      setCompetitors((current) =>
                        current.map((row, i) => (i === index ? { ...row, name: e.target.value } : row)),
                      )
                    }
                  />
                  <Input
                    placeholder="domain.example"
                    value={item.domain}
                    onChange={(e) =>
                      setCompetitors((current) =>
                        current.map((row, i) => (i === index ? { ...row, domain: e.target.value } : row)),
                      )
                    }
                  />
                </div>
              ))}
              {competitors.length < 5 ? (
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setCompetitors((current) => [...current, { name: "", domain: "" }])}
                >
                  Add competitor
                </Button>
              ) : null}
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="rounded-xl" onClick={nextFromCompetitors}>
                  Generate prompts
                </Button>
              </div>
            </>
          ) : null}
          {step === 3 ? (
            <>
              {prompts.map((prompt, index) => (
                <div key={`${prompt.intent}-${index}`}>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {INTENT_LABELS[prompt.intent]}
                  </p>
                  <Input
                    value={prompt.text}
                    onChange={(e) =>
                      setPrompts((current) =>
                        current.map((row, i) => (i === index ? { ...row, text: e.target.value } : row)),
                      )
                    }
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button className="rounded-xl" onClick={finish} disabled={busy}>
                  {busy ? "Saving…" : "Create brand"}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
