"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Save, Plus, Trash2, User, FileText, GraduationCap, Briefcase, Code2, FolderKanban, Lightbulb } from "lucide-react";
import type { IResume } from "@/models/resume.model";

interface ResumeEditFormProps {
  initialData: Partial<Omit<IResume, "_id" | "userId" | "createdAt" | "updatedAt">>;
  onSave?: () => void;
}

export default function ResumeEditForm({ initialData, onSave }: ResumeEditFormProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [feedback, setFeedback] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);

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

  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...(prev.projects || []), {
        name: "",
        description: "",
      }]
    }));
  };

  const updateProject = (index: number, field: string, value: any) => {
    const updated = [...(formData.projects || [])];
    if (field === 'technologies' && typeof value === 'string') {
      updated[index] = { ...updated[index], technologies: value.split(',').map(s => s.trim()) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, projects: updated }));
  };

  const removeProject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects?.filter((_, i) => i !== index)
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

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) return;
    
    setSavingFeedback(true);
    try {
      const response = await fetch("/api/resume/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedback.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save feedback");
      }

      alert("Feedback saved! It will be used for future resume parsing.");
      setFeedback("");
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setSavingFeedback(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Personal Information</h2>
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.personalInfo?.fullName || ""}
              onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.personalInfo?.email || ""}
              onChange={(e) => updatePersonalInfo("email", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.personalInfo?.phone || ""}
              onChange={(e) => updatePersonalInfo("phone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedIn">LinkedIn</Label>
            <Input
              id="linkedIn"
              value={formData.personalInfo?.linkedIn || ""}
              onChange={(e) => updatePersonalInfo("linkedIn", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              value={formData.personalInfo?.github || ""}
              onChange={(e) => updatePersonalInfo("github", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio</Label>
            <Input
              id="portfolio"
              value={formData.personalInfo?.portfolio || ""}
              onChange={(e) => updatePersonalInfo("portfolio", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Professional Summary</h2>
        </div>
        <Separator />
        <Textarea
          placeholder="Brief professional summary..."
          value={formData.summary || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
          rows={4}
        />
      </div>

      {/* Education */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Education</h2>
            {formData.education?.length ? (
              <Badge variant="secondary">{formData.education.length}</Badge>
            ) : null}
          </div>
          <Button type="button" onClick={addEducation} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        <Separator />
        <div className="space-y-4">
          {formData.education?.map((edu, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => removeEducation(index)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Input
                      value={edu.institution || ""}
                      onChange={(e) => updateEducation(index, "institution", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Degree</Label>
                    <Input
                      value={edu.degree || ""}
                      onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Major</Label>
                    <Input
                      value={edu.major || ""}
                      onChange={(e) => updateEducation(index, "major", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GPA</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={edu.gpa || ""}
                      onChange={(e) => updateEducation(index, "gpa", parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Work Experience */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Work Experience</h2>
            {formData.workExperience?.length ? (
              <Badge variant="secondary">{formData.workExperience.length}</Badge>
            ) : null}
          </div>
          <Button type="button" onClick={addWorkExperience} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        <Separator />
        <div className="space-y-4">
          {formData.workExperience?.map((exp, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => removeWorkExperience(index)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={exp.company || ""}
                      onChange={(e) => updateWorkExperience(index, "company", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input
                      value={exp.position || ""}
                      onChange={(e) => updateWorkExperience(index, "position", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={exp.location || ""}
                      onChange={(e) => updateWorkExperience(index, "location", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ""}
                      onChange={(e) => updateWorkExperience(index, "startDate", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={exp.description || ""}
                    onChange={(e) => updateWorkExperience(index, "description", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Projects</h2>
            {formData.projects?.length ? (
              <Badge variant="secondary">{formData.projects.length}</Badge>
            ) : null}
          </div>
          <Button type="button" onClick={addProject} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add Project
          </Button>
        </div>
        <Separator />
        <div className="space-y-4">
          {formData.projects?.map((project, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-start">
                  <Badge variant="outline">Project {index + 1}</Badge>
                  <Button
                    type="button"
                    onClick={() => removeProject(index)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project Name *</Label>
                    <Input
                      value={project.name || ""}
                      onChange={(e) => updateProject(index, "name", e.target.value)}
                      placeholder="E-Commerce Platform"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Your Role</Label>
                    <Input
                      value={project.role || ""}
                      onChange={(e) => updateProject(index, "role", e.target.value)}
                      placeholder="Full Stack Developer"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={project.description || ""}
                    onChange={(e) => updateProject(index, "description", e.target.value)}
                    rows={3}
                    placeholder="Brief overview of the project and its purpose..."
                  />
                </div>

                {/* Technologies */}
                <div className="space-y-2">
                  <Label>Technologies (comma-separated)</Label>
                  <Input
                    value={project.technologies?.join(", ") || ""}
                    onChange={(e) => updateProject(index, "technologies", e.target.value)}
                    placeholder="React, Node.js, MongoDB, AWS"
                  />
                </div>

                {/* Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GitHub Repository</Label>
                    <Input
                      value={project.github || ""}
                      onChange={(e) => updateProject(index, "github", e.target.value)}
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Live Demo / URL</Label>
                    <Input
                      value={project.url || ""}
                      onChange={(e) => updateProject(index, "url", e.target.value)}
                      placeholder="https://myproject.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Skills</h2>
            {formData.skills?.length ? (
              <Badge variant="secondary">{formData.skills.length}</Badge>
            ) : null}
          </div>
          <Button type="button" onClick={addSkillCategory} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add Category
          </Button>
        </div>
        <Separator />
        <div className="space-y-4">
          {formData.skills?.map((skillGroup, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => removeSkillCategory(index)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={skillGroup.category || ""}
                    onChange={(e) => updateSkillCategory(index, "category", e.target.value)}
                    placeholder="e.g., Programming Languages"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Skills (comma-separated)</Label>
                  <Input
                    value={skillGroup.skills?.join(", ") || ""}
                    onChange={(e) => updateSkillCategory(index, "skills", e.target.value)}
                    placeholder="e.g., JavaScript, Python, TypeScript"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Parsing Feedback */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Improve Parsing</h2>
        </div>
        <Separator />
        <p className="text-sm text-muted-foreground">
          Help us parse your resume better next time. Add suggestions about your field, format preferences, or specific details we should focus on.
        </p>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="e.g., 'Focus on technical skills for software engineering roles' or 'Include project links from GitHub'"
          rows={3}
        />
        <Button
          type="button"
          onClick={handleFeedbackSubmit}
          disabled={!feedback.trim() || savingFeedback}
          variant="outline"
        >
          {savingFeedback ? (
            <>
              <Spinner className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Suggestion
            </>
          )}
        </Button>
      </div>

      {/* Submit Button */}
      <Separator />
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={saving} size="lg">
          {saving ? (
            <>
              <Spinner className="mr-2" />
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
