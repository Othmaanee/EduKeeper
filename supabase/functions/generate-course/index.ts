
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const groqApiKey = Deno.env.get('GROQ_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Helper function to get a theme-appropriate illustration
function getThemeIllustration(subject: string): { emoji: string, decoration: string, backgroundColor: string } {
  // Default theme settings
  let emoji = "📚";
  let decoration = "scroll";
  let backgroundColor = "#f8fafc"; // Default light blue background
  
  // Convert subject to lowercase for easier matching
  const subjectLower = subject.toLowerCase();
  
  // Match subject to appropriate theme
  if (subjectLower.includes("math") || subjectLower.includes("mathématique") || subjectLower.includes("algèbre") || 
      subjectLower.includes("géométrie") || subjectLower.includes("calcul")) {
    emoji = "🧮";
    decoration = "formula";
    backgroundColor = "#f0f7ff"; // Très léger bleu
  } 
  else if (subjectLower.includes("physique") || subjectLower.includes("chimie") || 
           subjectLower.includes("science") || subjectLower.includes("laboratoire")) {
    emoji = "⚗️";
    decoration = "atoms";
    backgroundColor = "#f0f9ff"; // Bleu science très pâle
  } 
  else if (subjectLower.includes("histoire") || subjectLower.includes("géographie") || 
           subjectLower.includes("monde") || subjectLower.includes("civilisation")) {
    emoji = "🌍";
    decoration = "map";
    backgroundColor = "#fff8f0"; // Beige très pâle
  } 
  else if (subjectLower.includes("français") || subjectLower.includes("littérature") || 
           subjectLower.includes("écriture") || subjectLower.includes("grammaire")) {
    emoji = "✒️";
    decoration = "book";
    backgroundColor = "#faf5ff"; // Violet très pâle
  } 
  else if (subjectLower.includes("biologie") || subjectLower.includes("environnement") || 
           subjectLower.includes("nature") || subjectLower.includes("écologie")) {
    emoji = "🌿";
    decoration = "leaf";
    backgroundColor = "#f0fff4"; // Vert très pâle
  } 
  else if (subjectLower.includes("informatique") || subjectLower.includes("programmation") || 
           subjectLower.includes("code") || subjectLower.includes("technologie")) {
    emoji = "💻";
    decoration = "code";
    backgroundColor = "#f5f5f5"; // Gris très pâle
  } 
  else if (subjectLower.includes("art") || subjectLower.includes("dessin") || 
           subjectLower.includes("peinture") || subjectLower.includes("musique")) {
    emoji = "🎨";
    decoration = "palette";
    backgroundColor = "#fff0f7"; // Rose très pâle
  } 
  else if (subjectLower.includes("économie") || subjectLower.includes("finance") || 
           subjectLower.includes("business") || subjectLower.includes("commerce")) {
    emoji = "📊";
    decoration = "chart";
    backgroundColor = "#f0fff0"; // Vert finance très pâle
  } 
  else if (subjectLower.includes("sport") || subjectLower.includes("éducation physique") || 
           subjectLower.includes("santé") || subjectLower.includes("exercice")) {
    emoji = "🏃";
    decoration = "medal";
    backgroundColor = "#f0faff"; // Bleu sport très pâle
  } 
  else if (subjectLower.includes("langue") || subjectLower.includes("anglais") || 
           subjectLower.includes("espagnol") || subjectLower.includes("allemand")) {
    emoji = "🗣️";
    decoration = "speech";
    backgroundColor = "#fffaf0"; // Beige langue très pâle
  } 
  else if (subjectLower.includes("philosophie") || subjectLower.includes("psychologie") ||
           subjectLower.includes("éthique") || subjectLower.includes("morale")) {
    emoji = "🧠";
    decoration = "thought";
    backgroundColor = "#f5f0ff"; // Violet pensée très pâle
  }
  
  return { emoji, decoration, backgroundColor };
}

// Helper function to get SVG decoration based on the subject theme
function getThemeSvgDecoration(decoration: string): string {
  switch (decoration) {
    case "formula":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" style="position: absolute; top: 10px; right: 10px; opacity: 0.06;">
          <path d="M30,50 L90,50" stroke="#1a3e72" stroke-width="2" stroke-opacity="0.7"/>
          <path d="M40,65 L80,65" stroke="#1a3e72" stroke-width="2" stroke-opacity="0.7"/>
          <path d="M50,35 L70,35" stroke="#1a3e72" stroke-width="2" stroke-opacity="0.7"/>
          <text x="55" y="90" font-family="serif" font-size="16" fill="#1a3e72" fill-opacity="0.7">π=3.14</text>
        </svg>
      `;
    case "atoms":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" style="position: absolute; top: 10px; right: 10px; opacity: 0.06;">
          <ellipse cx="60" cy="60" rx="50" ry="25" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <ellipse cx="60" cy="60" rx="50" ry="25" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none" transform="rotate(60 60 60)"/>
          <ellipse cx="60" cy="60" rx="50" ry="25" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none" transform="rotate(120 60 60)"/>
          <circle cx="60" cy="60" r="8" fill="#1a3e72" fill-opacity="0.7"/>
        </svg>
      `;
    case "map":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" style="position: absolute; top: 10px; right: 10px; opacity: 0.06;">
          <path d="M30,30 C45,50 60,20 75,40 C90,60 100,30 110,50" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <path d="M20,60 C35,80 50,50 65,70 C80,90 95,60 110,80" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <circle cx="45" cy="45" r="5" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <circle cx="75" cy="65" r="5" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
        </svg>
      `;
    case "book":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" style="position: absolute; top: 10px; right: 10px; opacity: 0.06;">
          <path d="M30,30 L30,90 L90,90 L90,30 L30,30" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <path d="M30,30 L60,40 L90,30" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <path d="M60,40 L60,90" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7"/>
          <path d="M40,50 L55,50" stroke="#1a3e72" stroke-width="1" stroke-opacity="0.7"/>
          <path d="M40,60 L55,60" stroke="#1a3e72" stroke-width="1" stroke-opacity="0.7"/>
          <path d="M40,70 L55,70" stroke="#1a3e72" stroke-width="1" stroke-opacity="0.7"/>
          <path d="M65,50 L80,50" stroke="#1a3e72" stroke-width="1" stroke-opacity="0.7"/>
          <path d="M65,60 L80,60" stroke="#1a3e72" stroke-width="1" stroke-opacity="0.7"/>
          <path d="M65,70 L80,70" stroke="#1a3e72" stroke-width="1" stroke-opacity="0.7"/>
        </svg>
      `;
    case "leaf":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" style="position: absolute; top: 10px; right: 10px; opacity: 0.06;">
          <path d="M60,30 C90,30 90,90 60,90 C30,90 30,30 60,30 Z" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <path d="M40,60 C50,50 70,50 80,60" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <path d="M60,30 L60,90" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7"/>
          <path d="M40,45 C50,55 70,55 80,45" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <path d="M40,75 C50,65 70,65 80,75" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
        </svg>
      `;
    case "code":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" style="position: absolute; top: 10px; right: 10px; opacity: 0.06;">
          <path d="M40,50 L20,60 L40,70" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <path d="M80,50 L100,60 L80,70" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <path d="M70,40 L50,80" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7"/>
          <text x="50" y="95" font-family="monospace" font-size="10" fill="#1a3e72" fill-opacity="0.7">{code}</text>
        </svg>
      `;
    case "palette":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" style="position: absolute; top: 10px; right: 10px; opacity: 0.06;">
          <path d="M30,60 C30,40 40,30 60,30 C80,30 90,40 90,60 C90,80 80,90 60,90 C40,90 30,80 30,60 Z" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <circle cx="45" cy="45" r="5" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <circle cx="75" cy="45" r="5" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <circle cx="60" cy="75" r="5" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <path d="M30,60 L90,60" stroke="#1a3e72" stroke-width="1" stroke-opacity="0.5"/>
          <path d="M60,30 L60,90" stroke="#1a3e72" stroke-width="1" stroke-opacity="0.5"/>
        </svg>
      `;
    case "chart":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" style="position: absolute; top: 10px; right: 10px; opacity: 0.06;">
          <path d="M30,90 L30,30" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7"/>
          <path d="M30,90 L90,90" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7"/>
          <path d="M40,70 L40,90" stroke="#1a3e72" stroke-width="8" stroke-opacity="0.7"/>
          <path d="M50,50 L50,90" stroke="#1a3e72" stroke-width="8" stroke-opacity="0.7"/>
          <path d="M60,60 L60,90" stroke="#1a3e72" stroke-width="8" stroke-opacity="0.7"/>
          <path d="M70,40 L70,90" stroke="#1a3e72" stroke-width="8" stroke-opacity="0.7"/>
          <path d="M80,30 L80,90" stroke="#1a3e72" stroke-width="8" stroke-opacity="0.7"/>
        </svg>
      `;
    case "medal":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" style="position: absolute; top: 10px; right: 10px; opacity: 0.06;">
          <circle cx="60" cy="60" r="25" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <circle cx="60" cy="60" r="20" stroke="#1a3e72" stroke-width="1" stroke-opacity="0.7" fill="none"/>
          <path d="M60,35 L65,50 L80,50 L70,60 L75,75 L60,65 L45,75 L50,60 L40,50 L55,50 Z" stroke="#1a3e72" stroke-width="1" stroke-opacity="0.7" fill="none"/>
        </svg>
      `;
    case "speech":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" style="position: absolute; top: 10px; right: 10px; opacity: 0.06;">
          <path d="M30,50 C30,40 40,30 60,30 C80,30 90,40 90,50 C90,60 80,70 60,70 C55,70 50,69 45,68 L35,80 L35,65 C32,61 30,56 30,50 Z" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <text x="45" y="55" font-family="sans-serif" font-size="16" fill="#1a3e72" fill-opacity="0.7">A B C</text>
        </svg>
      `;
    case "thought":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" style="position: absolute; top: 10px; right: 10px; opacity: 0.06;">
          <path d="M40,60 C40,45 50,35 65,35 C80,35 90,45 90,60" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <path d="M40,60 C40,75 50,85 65,85 C80,85 90,75 90,60" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <path d="M30,60 L100,60" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7"/>
          <circle cx="65" cy="40" r="3" fill="#1a3e72" fill-opacity="0.7"/>
          <circle cx="65" cy="80" r="3" fill="#1a3e72" fill-opacity="0.7"/>
        </svg>
      `;
    case "scroll":
    default:
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" style="position: absolute; top: 10px; right: 10px; opacity: 0.06;">
          <path d="M30,30 C60,25 60,25 90,30 L90,80 C60,75 60,75 30,80 L30,30 Z" stroke="#1a3e72" stroke-width="1.5" stroke-opacity="0.7" fill="none"/>
          <path d="M40,45 L80,45" stroke="#1a3e72" stroke-width="1" stroke-opacity="0.7"/>
          <path d="M40,55 L80,55" stroke="#1a3e72" stroke-width="1" stroke-opacity="0.7"/>
          <path d="M40,65 L80,65" stroke="#1a3e72" stroke-width="1" stroke-opacity="0.7"/>
        </svg>
      `;
  }
}

// Helper function to convert markdown-like content to HTML
function formatCourseContent(content: string, subject: string): string {
  if (!content) return "";
  
  // First pass: clean up any markdown syntax that might not render correctly
  let formattedContent = content
    // Replace markdown bold with HTML bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Replace markdown italic with HTML italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Replace markdown headers
    .replace(/^# (.*?)$/gm, '<h1 class="course-h1">$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2 class="course-h2">$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3 class="course-h3">$1</h3>')
    // Handle bullet lists
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/^[0-9]+\. (.*?)$/gm, '<li>$1</li>');
  
  // Second pass: structure content with proper HTML
  
  // Process lists: look for consecutive li elements and wrap them in ul
  formattedContent = formattedContent.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)+/gs, '<ul class="course-list">$&</ul>');
  
  // Split by new lines and process paragraphs
  const lines = formattedContent.split('\n');
  let htmlContent = '';
  let inParagraph = false;
  let skipLine = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (skipLine) {
      skipLine = false;
      continue;
    }
    
    const line = lines[i].trim();
    
    // Skip empty lines
    if (line === '') {
      if (inParagraph) {
        htmlContent += '</p>\n';
        inParagraph = false;
      }
      continue;
    }
    
    // Don't wrap elements that are already HTML
    if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<li') || 
        line.startsWith('<ol') || line.startsWith('<table') || line.includes('</ul>')) {
      if (inParagraph) {
        htmlContent += '</p>\n';
        inParagraph = false;
      }
      htmlContent += line + '\n';
    } 
    else {
      if (!inParagraph) {
        htmlContent += '<p class="course-paragraph">';
        inParagraph = true;
      }
      htmlContent += line + ' ';
    }
  }
  
  if (inParagraph) {
    htmlContent += '</p>\n';
  }
  
  // Get appropriate theme elements based on subject
  const { emoji, decoration, backgroundColor } = getThemeIllustration(subject);
  const decorationSvg = getThemeSvgDecoration(decoration);
  
  // Add CSS for better formatting in the PDF
  const styledContent = `
    <div class="course-container">
      <style>
        .course-container {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          background-color: ${backgroundColor};
          padding: 25px 35px 40px;
          border-radius: 8px;
          position: relative;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .course-icon {
          position: absolute;
          top: 20px;
          right: 25px;
          font-size: 36px;
          opacity: 0.8;
          z-index: 5;
        }
        .course-decoration {
          position: absolute;
          top: 0;
          right: 0;
          width: 120px;
          height: 120px;
          opacity: 0.06;
          z-index: 1;
        }
        .course-h1 {
          font-size: 24px;
          margin-top: 28px;
          margin-bottom: 16px;
          color: #1a3e72;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
        }
        .course-h2 {
          font-size: 20px;
          margin-top: 24px;
          margin-bottom: 14px;
          color: #2a5ca8;
        }
        .course-h3 {
          font-size: 18px;
          margin-top: 20px;
          margin-bottom: 12px;
          color: #3670cc;
        }
        .course-paragraph {
          margin: 14px 0;
          text-align: justify;
          line-height: 1.7;
        }
        .course-list {
          margin: 16px 0;
          padding-left: 24px;
        }
        .course-list li {
          margin: 8px 0;
        }
        strong {
          color: #1e4b8d;
        }
        .course-footer {
          text-align: right;
          margin-top: 30px;
          font-size: 24px;
          opacity: 0.7;
        }
        .watermark {
          position: fixed;
          bottom: 20px;
          right: 20px;
          font-size: 12px;
          color: #8898aa;
          opacity: 0.5;
        }
        @page {
          margin: 14mm;
          background-color: ${backgroundColor};
        }
      </style>
      <div class="course-icon">${emoji}</div>
      ${decorationSvg}
      ${htmlContent}
      <div class="course-footer">${emoji}</div>
      <div class="watermark">Généré par IA - EduVault</div>
    </div>
  `;
  
  return styledContent;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fonction generate-course appelée");
    
    // Parse the request body safely
    let subject, courseLevel, courseStyle, courseDuration;
    try {
      const body = await req.json();
      subject = body.subject;
      courseLevel = body.courseLevel || "college";
      courseStyle = body.courseStyle || "detailed";
      courseDuration = body.courseDuration || "15min";
      
      console.log("Paramètres reçus:", { subject, courseLevel, courseStyle, courseDuration });
    } catch (parseError) {
      console.error('Erreur de parsing du JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Format de requête invalide' 
        }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }

    if (!subject) {
      console.error('Aucun sujet fourni');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun sujet fourni' 
        }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }

    console.log("Clé API Groq présente:", !!groqApiKey);
    if (!groqApiKey) {
      console.error('Clé API Groq manquante');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Clé API Groq manquante. Veuillez configurer la clé dans les secrets de la fonction Edge.' 
        }),
        { 
          status: 500, 
          headers: corsHeaders
        }
      );
    }

    // Traduire les valeurs des options en texte compréhensible
    const levelText = {
      "primary": "primaire (6-10 ans)",
      "college": "collège (11-15 ans)",
      "highschool": "lycée (16-18 ans)",
      "university": "études supérieures"
    }[courseLevel] || "collège";

    const styleText = {
      "summary": "résumé simple et concis",
      "detailed": "cours détaillé avec exemples",
      "flashcards": "fiches de révision avec points clés"
    }[courseStyle] || "cours détaillé";

    const durationText = {
      "5min": "environ 5 minutes de lecture",
      "15min": "environ 15 minutes de lecture",
      "30min": "environ 30 minutes de lecture"
    }[courseDuration] || "15 minutes";

    // Créer un prompt adapté aux options sélectionnées
    const systemPrompt = `Tu es un professeur expert qui génère un cours clair et pédagogique. 
Ton objectif est de créer un contenu éducatif de grande qualité, adapté au niveau demandé, avec le style spécifié, et pour la durée indiquée.
Utilise des titres principaux (# Titre), des sous-titres (## Sous-titre) et des points clés (### Point clé) pour une structure claire.
Mets en **gras** les concepts importants.
Organise le contenu avec des listes à puces lorsque c'est pertinent.
Le cours doit être bien structuré pour faciliter la lecture et l'apprentissage.`;

    const userPrompt = `Rédige un cours sur le sujet suivant: ${subject}
    
Niveau: ${levelText}
Style: ${styleText}
Durée de lecture: ${durationText}

Assure-toi que le contenu soit:
- Adapté au niveau demandé, avec un vocabulaire et des explications appropriés
- Structuré selon le style demandé (résumé, cours détaillé ou fiches)
- D'une longueur permettant une lecture en ${durationText}
- Pédagogique et engageant pour l'élève

Utilise une structure claire avec:
- Un titre principal (# Titre)
- Des sous-sections (## Sous-titre)
- Des points clés (### Point clé) si pertinent
- Des listes à puces pour les énumérations
- Du texte **en gras** pour les concepts importants
`;

    try {
      console.log("Appel à l'API Groq...");
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
        }),
      });

      // Handle API errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Erreur de l'API Groq";
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          // If we can't parse the error, use the raw text
          errorMessage = errorText || errorMessage;
        }
        
        console.error('Erreur API Groq:', errorMessage);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erreur API Groq: ${errorMessage}` 
          }),
          { 
            status: 500, 
            headers: corsHeaders
          }
        );
      }

      const data = await response.json();
      const rawCourseContent = data.choices[0].message.content;
      
      // Format the course content for better readability
      const formattedContent = formatCourseContent(rawCourseContent, subject);
      console.log("Cours généré et formaté avec succès");

      return new Response(
        JSON.stringify({ 
          success: true, 
          content: formattedContent
        }),
        { headers: corsHeaders }
      );
    } catch (groqError) {
      console.error('Erreur lors de l\'appel à l\'API Groq:', groqError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: groqError.message || 'Erreur lors de la génération du cours' 
        }),
        { 
          status: 500, 
          headers: corsHeaders
        }
      );
    }
  } catch (error) {
    console.error('Erreur générale dans la fonction generate-course:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Une erreur inconnue est survenue' 
      }),
      { 
        status: 500, 
        headers: corsHeaders
      }
    );
  }
});
