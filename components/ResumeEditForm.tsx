"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import type { IResume } from "@/models/resume.model";

interface ResumeEditFormProps {
  initialData: Partial<Omit<IResume, "_id" | "userId" | "createdAt" | "updatedAt">>;
  onSave?: () => void;
}

export default function ResumeEditForm({ initialData, onSave }: ResumeEditFormProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/resume/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save resume");
      }

      alert("Resume saved successfully!");
      onSave?.();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo!, [field]: value }
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...(prev.education || []), {
        institution: "",
        degree: "",
        major: "",
      }]
    }));
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updated = [...(formData.education || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, education: updated }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index)
    }));
  };

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [...(prev.workExperience || []), {
        company: "",
        position: "",
        description: "",
      }]
    }));
  };

  const updateWorkExperience = (index: number, field: string, value: any) => {
    const updated = [...(formData.workExperience || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, workExperience: updated }));
  };

  const removeWorkExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience?.filter((_, i) => i !== index)
    }));
  };

  const addSkillCategory = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...(prev.skills || []), {
        category: "",
        skills: []
      }]
    }));
  };

  const updateSkillCategory = (index: number, field: string, value: any) => {
    const updated = [...(formData.skills || [])];
    if (field === 'skills' && typeof value === 'string') {
      updated[index] = { ...updated[index], skills: value.split(',').map(s => s.trim()) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, skills: updated }));
  };

  const removeSkillCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.personalInfo?.fullName || ""}
                onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.personalInfo?.email || ""}
                onChange={(e) => updatePersonalInfo("email", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.personalInfo?.phone || ""}
                onChange={(e) => updatePersonalInfo("phone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="linkedIn">LinkedIn</Label>
              <Input
                id="linkedIn"
                value={formData.personalInfo?.linkedIn || ""}
                onChange={(e) => updatePersonalInfo("linkedIn", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={formData.personalInfo?.github || ""}
                onChange={(e) => updatePersonalInfo("github", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="portfolio">Portfolio</Label>
              <Input
                id="portfolio"
                value={formData.personalInfo?.portfolio || ""}
                onChange={(e) => updatePersonalInfo("portfolio", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Brief professional summary..."
            value={formData.summary || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Education</CardTitle>
          <Button type="button" onClick={addEducation} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Education
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.education?.map((edu, index) => (
            <div key={index} className="border rounded-lg p-4 relative space-y-3">
              <Button
                type="button"
                onClick={() => removeEducation(index)}
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Institution</Label>
                  <Input
                    value={edu.institution || ""}
                    onChange={(e) => updateEducation(index, "institution", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Degree</Label>
                  <Input
                    value={edu.degree || ""}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Major</Label>
                  <Input
                    value={edu.major || ""}
                    onChange={(e) => updateEducation(index, "major", e.target.value)}
                  />
                </div>
                <div>
                  <Label>GPA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={edu.gpa || ""}
                    onChange={(e) => updateEducation(index, "gpa", parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Work Experience</CardTitle>
          <Button type="button" onClick={addWorkExperience} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.workExperience?.map((exp, index) => (
            <div key={index} className="border rounded-lg p-4 relative space-y-3">
              <Button
                type="button"
                onClick={() => removeWorkExperience(index)}
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Company</Label>
                  <Input
                    value={exp.company || ""}
                    onChange={(e) => updateWorkExperience(index, "company", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Position</Label>
                  <Input
                    value={exp.position || ""}
                    onChange={(e) => updateWorkExperience(index, "position", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={exp.location || ""}
                    onChange={(e) => updateWorkExperience(index, "location", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ""}
                    onChange={(e) => updateWorkExperience(index, "startDate", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={exp.description || ""}
                  onChange={(e) => updateWorkExperience(index, "description", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Skills</CardTitle>
          <Button type="button" onClick={addSkillCategory} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.skills?.map((skillGroup, index) => (
            <div key={index} className="border rounded-lg p-4 relative space-y-3">
              <Button
                type="button"
                onClick={() => removeSkillCategory(index)}
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div>
                <Label>Category</Label>
                <Input
                  value={skillGroup.category || ""}
                  onChange={(e) => updateSkillCategory(index, "category", e.target.value)}
                  placeholder="e.g., Programming Languages"
                />
              </div>
              <div>
                <Label>Skills (comma-separated)</Label>
                <Input
                  value={skillGroup.skills?.join(", ") || ""}
                  onChange={(e) => updateSkillCategory(index, "skills", e.target.value)}
                  placeholder="e.g., JavaScript, Python, TypeScript"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Resume
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
