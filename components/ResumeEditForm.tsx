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
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 hover:border-violet-500/30 transition-colors">
        <CardHeader>
          <CardTitle className="text-violet-300 flex items-center gap-2">
            <div className="w-1 h-6 bg-violet-500 rounded-full"></div>
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName" className="text-gray-300">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.personalInfo?.fullName || ""}
                onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                required
                className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-300">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.personalInfo?.email || ""}
                onChange={(e) => updatePersonalInfo("email", e.target.value)}
                required
                className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-gray-300">Phone</Label>
              <Input
                id="phone"
                value={formData.personalInfo?.phone || ""}
                onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50"
              />
            </div>
            <div>
              <Label htmlFor="linkedIn" className="text-gray-300">LinkedIn</Label>
              <Input
                id="linkedIn"
                value={formData.personalInfo?.linkedIn || ""}
                onChange={(e) => updatePersonalInfo("linkedIn", e.target.value)}
                className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50"
              />
            </div>
            <div>
              <Label htmlFor="github" className="text-gray-300">GitHub</Label>
              <Input
                id="github"
                value={formData.personalInfo?.github || ""}
                onChange={(e) => updatePersonalInfo("github", e.target.value)}
                className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50"
              />
            </div>
            <div>
              <Label htmlFor="portfolio" className="text-gray-300">Portfolio</Label>
              <Input
                id="portfolio"
                value={formData.personalInfo?.portfolio || ""}
                onChange={(e) => updatePersonalInfo("portfolio", e.target.value)}
                className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 hover:border-violet-500/30 transition-colors">
        <CardHeader>
          <CardTitle className="text-violet-300 flex items-center gap-2">
            <div className="w-1 h-6 bg-violet-500 rounded-full"></div>
            Professional Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Brief professional summary..."
            value={formData.summary || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
            rows={4}
            className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50"
          />
        </CardContent>
      </Card>

      {/* Education */}
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 hover:border-blue-500/30 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-blue-300 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            Education
          </CardTitle>
          <Button type="button" onClick={addEducation} size="sm" variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Add Education
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.education?.map((edu, index) => (
            <div key={index} className="border border-white/10 bg-black/20 rounded-lg p-4 relative space-y-3">
              <Button
                type="button"
                onClick={() => removeEducation(index)}
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Institution</Label>
                  <Input
                    value={edu.institution || ""}
                    onChange={(e) => updateEducation(index, "institution", e.target.value)}
                    className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Degree</Label>
                  <Input
                    value={edu.degree || ""}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Major</Label>
                  <Input
                    value={edu.major || ""}
                    onChange={(e) => updateEducation(index, "major", e.target.value)}
                    className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">GPA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={edu.gpa || ""}
                    onChange={(e) => updateEducation(index, "gpa", parseFloat(e.target.value))}
                    className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 hover:border-purple-500/30 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
            Work Experience
          </CardTitle>
          <Button type="button" onClick={addWorkExperience} size="sm" variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.workExperience?.map((exp, index) => (
            <div key={index} className="border border-white/10 bg-black/20 rounded-lg p-4 relative space-y-3">
              <Button
                type="button"
                onClick={() => removeWorkExperience(index)}
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Company</Label>
                  <Input
                    value={exp.company || ""}
                    onChange={(e) => updateWorkExperience(index, "company", e.target.value)}
                    className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Position</Label>
                  <Input
                    value={exp.position || ""}
                    onChange={(e) => updateWorkExperience(index, "position", e.target.value)}
                    className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Location</Label>
                  <Input
                    value={exp.location || ""}
                    onChange={(e) => updateWorkExperience(index, "location", e.target.value)}
                    className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Start Date</Label>
                  <Input
                    type="date"
                    value={exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ""}
                    onChange={(e) => updateWorkExperience(index, "startDate", e.target.value)}
                    className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Description</Label>
                <Textarea
                  value={exp.description || ""}
                  onChange={(e) => updateWorkExperience(index, "description", e.target.value)}
                  rows={3}
                  className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="bg-black/40 backdrop-blur-sm border-white/10 hover:border-fuchsia-500/30 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-fuchsia-300 flex items-center gap-2">
            <div className="w-1 h-6 bg-fuchsia-500 rounded-full"></div>
            Skills
          </CardTitle>
          <Button type="button" onClick={addSkillCategory} size="sm" variant="outline" className="bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.skills?.map((skillGroup, index) => (
            <div key={index} className="border border-white/10 bg-black/20 rounded-lg p-4 relative space-y-3">
              <Button
                type="button"
                onClick={() => removeSkillCategory(index)}
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div>
                <Label className="text-gray-300">Category</Label>
                <Input
                  value={skillGroup.category || ""}
                  onChange={(e) => updateSkillCategory(index, "category", e.target.value)}
                  placeholder="e.g., Programming Languages"
                  className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-fuchsia-500/50"
                />
              </div>
              <div>
                <Label className="text-gray-300">Skills (comma-separated)</Label>
                <Input
                  value={skillGroup.skills?.join(", ") || ""}
                  onChange={(e) => updateSkillCategory(index, "skills", e.target.value)}
                  placeholder="e.g., JavaScript, Python, TypeScript"
                  className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-fuchsia-500/50"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={saving} size="lg" className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40">
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
