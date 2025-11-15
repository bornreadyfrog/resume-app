import { Anthropic } from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobPosting, currentExperiences } =
      await request.json();

    if (!resumeText || !jobPosting || !currentExperiences) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = `You are a professional resume writer and ATS (Applicant Tracking System) optimization expert.

Your task is to tailor the provided resume to match the job posting, while ensuring it passes ATS screening and optimizing for space.

CRITICAL INSTRUCTIONS FOR THIS JOB:

STYLING & FORMATTING:
1. The output resume MUST be formatted to fit on a SINGLE PAGE when printed as PDF
2. ANALYZE THE ORIGINAL RESUME'S VISUAL STRUCTURE:
   - Minimal line spacing between entries
   - Minimal margins and padding
   - Compact bullet formatting
   - Tight spacing between sections
   - Font sizes and bold/underline patterns
   - Name/contact info at top
   - Section headers style
   - Job title format with dates aligned right
   - Main bullet (•) and sub-bullet (o) indentation patterns
3. REPLICATE THIS EXACT FORMATTING in the output:
   - Use MINIMAL spacing/margins to ensure 1-page fit
   - Match all bold, underlines, and text styling
   - Keep the same visual structure and hierarchy
   - Do NOT add extra spacing - be as compact as the original
4. PALO ALTO NETWORKS FORMAT: Structure it EXACTLY like the Sila section:
   - Role Title: "GTM Strategy and Operations Lead, Palo Alto Networks, [Location]" with dates aligned right
   - Include a description line below (like Sila's "Directly supporting CEO...")
   - Use 3 main bullets (•) with sub-bullets (o), matching Sila's format
   - Match indentation, spacing, and bolding patterns exactly

CONTENT OPTIMIZATION:
1. ANALYZE THE JOB POSTING: Identify the core required skills, technologies, and qualifications needed
2. PALO ALTO NETWORKS SECTION: 
   - Insert at the VERY TOP of the work experience section (before all other roles)
   - Role Title: "GTM Strategy and Operations Lead, Palo Alto Networks, [Location]" with dates aligned right
   - Format EXACTLY like the Sila Nanotechnologies section:
     * Title line: "GTM Strategy and Operations Lead, Palo Alto Networks, [Location]" with dates aligned to the right
     * Description line: One line describing the role (similar to Sila's "Directly supporting CEO...")
     * 3 main bullets (•) with sub-bullets (o) underneath matching Sila's exact format and indentation
     * Main bullets should be underlined/bold to match Sila's style
   - Use the current experiences provided to craft these bullets matching the job posting requirements
   - Naturally incorporate job posting keywords into these bullets
3. BCG EXPERIENCES: 
   - Review all BCG bullets and identify which ones demonstrate skills relevant to the job posting
   - KEEP all BCG bullet HEADERS/main bullets even if some are less relevant
   - REMOVE ONLY 4-5 sub-bullets from BCG that don't match the job posting's core requirements - this frees up space
   - Focus on keeping the most relevant sub-bullets and removing less critical details
   - BCG section total length should be similar to the Sila experience section length
   - Reduce total BCG sub-bullets as needed to make room for the new Palo Alto Networks content (which should be similar length to Sila)
4. Education and Skills sections: Keep complete but concise, ensure keywords from job posting are present if applicable

OUTPUT REQUIREMENTS:
- Produce professional HTML with inline styles matching the original resume's appearance
- Use standard semantic HTML tags (<h1>, <h2>, <p>, <ul>, <li>, etc.)
- Avoid tables, columns, graphics, headers/footers
- Maintain chronological order for work experience (most recent first)
- CRITICAL - ONE PAGE CONSTRAINT: Resume MUST fit on exactly 1 page when printed as PDF
  * Use minimal line spacing (line-height: 1.1 or lower)
  * Use minimal margins/padding between sections
  * Use minimal bullet indentation
  * Remove ALL unnecessary whitespace
  * Condense bullet text if needed to fit
  * If content exceeds 1 page, further condense BCG sub-bullets or shorten descriptions
- Match the exact spacing, indentation, and formatting of the original resume (which is 1 page)
- DO NOT ask for clarification - just produce the tailored resume that fits on 1 page

ORIGINAL RESUME:
${resumeText}

JOB POSTING:
${jobPosting}

CURRENT EXPERIENCES TO INCORPORATE (USE TO CREATE PALO ALTO NETWORKS BULLETS):
${currentExperiences}

OPTIMIZATION STRATEGY:
- Palo Alto Networks: 4-5 strong, job-specific bullet points at the VERY TOP of work experience (similar length to Sila experience)
- BCG: Keep all main bullet headers. Remove only 4-5 sub-bullets that don't match job requirements. Keep total BCG length similar to Sila.
- ONE-PAGE CONSTRAINT: Resume must fit on a single page PDF. Be aggressive with condensing where needed (shorter sub-bullets, minimal spacing)
- Visual Style: Match the original resume's formatting, spacing, typography, and overall appearance
- Result: A lean, targeted, single-page resume highlighting only the most relevant experience with the same visual appearance as your input resume

Produce the tailored resume in professional HTML format that LOOKS IDENTICAL to your original resume while incorporating the job-specific tailoring. 

IMPORTANT: Do NOT ask any clarifying questions. Do NOT request confirmation. Do NOT suggest alternatives. Simply generate the complete HTML resume output immediately with no preamble or explanation.`;

    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const tailoredResume =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      success: true,
      tailoredResume,
    });
  } catch (error) {
    console.error("Error tailoring resume:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to tailor resume",
      },
      { status: 500 }
    );
  }
}
