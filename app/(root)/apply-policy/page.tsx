"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, X } from "lucide-react";

interface ApplyPolicy {
  maxApplicationsPerDay: number;
  minMatchScore: number;
  allowedLocations: string[];
  remoteOnly: boolean;
  visaRequired: boolean;
  blockedCompanies: string[];
  blockedRoles: string[];
  companyCooldownDays: number;
  killSwitch: boolean;
}

export default function ApplyPolicyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<ApplyPolicy>({
    maxApplicationsPerDay: 10,
    minMatchScore: 40,
    allowedLocations: [],
    remoteOnly: false,
    visaRequired: false,
    blockedCompanies: [],
    blockedRoles: [],
    companyCooldownDays: 30,
    killSwitch: false,
  });

  // Temporary input states for arrays
  const [locationInput, setLocationInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [roleInput, setRoleInput] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    } else if (status === "authenticated") {
      fetchPolicy();
    }
  }, [status, router]);

  const fetchPolicy = async () => {
    try {
      const response = await fetch("/api/apply-policy");
      if (response.ok) {
        const data = await response.json();
        if (data.applyPolicy) {
          setPolicy(data.applyPolicy);
        }
      }
    } catch (error) {
      console.error("Error fetching policy:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/apply-policy", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applyPolicy: policy }),
      });

      if (response.ok) {
        alert("Apply Policy updated successfully!");
      } else {
        alert("Failed to update policy");
      }
    } catch (error) {
      console.error("Error saving policy:", error);
      alert("Error saving policy");
    } finally {
      setSaving(false);
    }
  };

  const addItem = (type: "location" | "company" | "role") => {
    let input = "";
    let setter: (val: string) => void;
    let field: keyof Pick<ApplyPolicy, "allowedLocations" | "blockedCompanies" | "blockedRoles">;

    if (type === "location") {
      input = locationInput;
      setter = setLocationInput;
      field = "allowedLocations";
    } else if (type === "company") {
      input = companyInput;
      setter = setCompanyInput;
      field = "blockedCompanies";
    } else {
      input = roleInput;
      setter = setRoleInput;
      field = "blockedRoles";
    }

    if (input.trim()) {
      setPolicy((prev) => ({
        ...prev,
        [field]: [...prev[field], input.trim()],
      }));
      setter("");
    }
  };

  const removeItem = (
    type: "location" | "company" | "role",
    index: number
  ) => {
    const field =
      type === "location"
        ? "allowedLocations"
        : type === "company"
        ? "blockedCompanies"
        : "blockedRoles";

    setPolicy((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Apply Policy Settings</h1>
          <p className="text-muted-foreground">
            Configure your job application preferences and restrictions
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Application Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Application Limits</CardTitle>
            <CardDescription>
              Control how many applications are submitted daily
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="maxApplications">
                Max Applications Per Day
              </Label>
              <Input
                id="maxApplications"
                type="number"
                min="0"
                value={policy.maxApplicationsPerDay}
                onChange={(e) =>
                  setPolicy({
                    ...policy,
                    maxApplicationsPerDay: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="minMatchScore">
                Minimum Match Score (0-100)
              </Label>
              <Input
                id="minMatchScore"
                type="number"
                min="0"
                max="100"
                value={policy.minMatchScore}
                onChange={(e) =>
                  setPolicy({
                    ...policy,
                    minMatchScore: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Only apply to jobs with a match score above this threshold
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="companyCooldown">
                Company Cooldown (days)
              </Label>
              <Input
                id="companyCooldown"
                type="number"
                min="0"
                value={policy.companyCooldownDays}
                onChange={(e) =>
                  setPolicy({
                    ...policy,
                    companyCooldownDays: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Wait this many days before applying to the same company again
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Location Preferences</CardTitle>
            <CardDescription>
              Specify preferred job locations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remoteOnly"
                checked={policy.remoteOnly}
                onChange={(e) =>
                  setPolicy({ ...policy, remoteOnly: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="remoteOnly" className="cursor-pointer">
                Remote Only
              </Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="allowedLocations">Allowed Locations</Label>
              <div className="flex gap-2">
                <Input
                  id="allowedLocations"
                  placeholder="e.g., San Francisco, New York"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("location");
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addItem("location")}
                  variant="secondary"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {policy.allowedLocations.map((loc, idx) => (
                  <Badge key={idx} variant="secondary">
                    {loc}
                    <button
                      onClick={() => removeItem("location", idx)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Authorization */}
        <Card>
          <CardHeader>
            <CardTitle>Work Authorization</CardTitle>
            <CardDescription>
              Specify visa requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="visaRequired"
                checked={policy.visaRequired}
                onChange={(e) =>
                  setPolicy({ ...policy, visaRequired: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="visaRequired" className="cursor-pointer">
                Requires Visa Sponsorship
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Blocked Companies */}
        <Card>
          <CardHeader>
            <CardTitle>Blocked Companies</CardTitle>
            <CardDescription>
              Companies you don't want to apply to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Acme Corp"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem("company");
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addItem("company")}
                variant="secondary"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {policy.blockedCompanies.map((company, idx) => (
                <Badge key={idx} variant="secondary">
                  {company}
                  <button
                    onClick={() => removeItem("company", idx)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Blocked Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Blocked Roles</CardTitle>
            <CardDescription>
              Job roles you want to avoid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Sales, Marketing"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem("role");
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addItem("role")}
                variant="secondary"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {policy.blockedRoles.map((role, idx) => (
                <Badge key={idx} variant="secondary">
                  {role}
                  <button
                    onClick={() => removeItem("role", idx)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kill Switch */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Emergency Stop</CardTitle>
            <CardDescription>
              Immediately halt all automated job applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="killSwitch"
                checked={policy.killSwitch}
                onChange={(e) =>
                  setPolicy({ ...policy, killSwitch: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="killSwitch" className="cursor-pointer font-semibold">
                Activate Kill Switch (Stop All Applications)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Policy
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
