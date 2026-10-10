import re
import json

def update_schema(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to replace the phq9_score and gad7_score objects and perceived_stress_pss10
    
    # 1. Replace perceived_stress_pss10
    # Let's find the block for perceived_stress_pss10 and replace it.
    
    # Let's just do a regex that captures the whole question object for perceived_stress_pss10
    pss10_pattern = r'\{\s*id:\s*"perceived_stress_pss10"[\s\S]*?evidenceNote:\s*\{[^}]*\}\s*\}'
    
    pss10_replacement = """{
      id: "perceived_stress_rating",
      block: 6,
      question: { en: "Over the past month, how stressed have you felt overall?", hi: "पिछले एक महीने में, आपने कुल मिलाकर कितना तनाव महसूस किया है?" },
      field: "perceived_stress_rating",
      type: "slider",
      options: [
        { value: "0", label: { en: "Minimal (0)", hi: "न्यूनतम (0)" } },
        { value: "5", label: { en: "Moderate (5)", hi: "मध्यम (5)" } },
        { value: "10", label: { en: "Severe (10)", hi: "गंभीर (10)" } }
      ],
      required: true,
      whyWeAsk: { en: "High perceived stress levels activate the hypothalamic-pituitary-adrenal axis, elevating cortisol.", hi: "उच्च तनाव का स्तर शरीर में कोर्टिसोल हार्मोन के स्राव को बढ़ाता है।" },
      relevance: "high",
      sensitivity: false,
      evidenceNote: { en: "Clinical screening parameter.", hi: "नैदानिक ​​स्क्रीनिंग पैरामीटर।" }
    }"""
    
    content = re.sub(pss10_pattern, pss10_replacement, content)
    
    # 2. Replace gad7_score
    gad7_pattern = r'\{\s*id:\s*"gad7_score"[\s\S]*?evidenceNote:\s*\{[^}]*\}\s*\}'
    
    gad7_items = [
        "Feeling nervous, anxious or on edge",
        "Not being able to stop or control worrying",
        "Worrying too much about different things",
        "Trouble relaxing",
        "Being so restless that it is hard to sit still",
        "Becoming easily annoyed or irritable",
        "Feeling afraid, as if something awful might happen"
    ]
    
    gad7_questions = []
    for i, item in enumerate(gad7_items):
        q = f"""{{
      id: "gad7_item_{i+1}",
      block: 6,
      group: "gad7",
      """
        if i == 0:
            q += f'preamble: {{ en: "Over the last 2 weeks, how often have you been bothered by the following problems?", hi: "TODO(verify): validated Hindi translation" }},\n      '
        q += f"""question: {{ en: "{item}", hi: "TODO(verify): validated Hindi translation" }},
      field: "gad7_item_{i+1}",
      type: "segmented",
      options: [
        {{ value: "0", label: {{ en: "Not at all", hi: "TODO(verify): validated Hindi translation" }} }},
        {{ value: "1", label: {{ en: "Several days", hi: "TODO(verify): validated Hindi translation" }} }},
        {{ value: "2", label: {{ en: "More than half the days", hi: "TODO(verify): validated Hindi translation" }} }},
        {{ value: "3", label: {{ en: "Nearly every day", hi: "TODO(verify): validated Hindi translation" }} }}
      ],
      required: true,
      whyWeAsk: {{ en: "Generalized anxiety triggers physiological sympathetic responses affecting vascular efficiency.", hi: "सामान्यीकृत चिंता शारीरिक तनाव को बढ़ाती है जो रक्त प्रवाह की दक्षता को प्रभावित करती है।" }},
      relevance: "high",
      sensitivity: false,
      evidenceNote: {{ en: "Clinical screening parameter.", hi: "नैदानिक ​​स्क्रीनिंग पैरामीटर।" }}
    }}"""
        gad7_questions.append(q)
        
    gad7_replacement = ",\n    ".join(gad7_questions)
    content = re.sub(gad7_pattern, gad7_replacement, content)
    
    # 3. Replace phq9_score
    phq9_pattern = r'\{\s*id:\s*"phq9_score"[\s\S]*?evidenceNote:\s*\{[^}]*\}\s*\}'
    
    phq9_items = [
        "Little interest or pleasure in doing things",
        "Feeling down, depressed, or hopeless",
        "Trouble falling or staying asleep, or sleeping too much",
        "Feeling tired or having little energy",
        "Poor appetite or overeating",
        "Feeling bad about yourself, or that you are a failure or have let yourself or your family down",
        "Trouble concentrating on things, such as reading the newspaper or watching television",
        "Moving or speaking so slowly that other people could have noticed? Or the opposite: being so fidgety or restless that you have been moving around a lot more than usual",
        "Thoughts that you would be better off dead, or of hurting yourself in some way"
    ]
    
    phq9_questions = []
    for i, item in enumerate(phq9_items):
        q = f"""{{
      id: "phq9_item_{i+1}",
      block: 6,
      group: "phq9",
      """
        if i == 0:
            q += f'preamble: {{ en: "Over the last 2 weeks, how often have you been bothered by any of the following problems?", hi: "TODO(verify): validated Hindi translation" }},\n      '
        q += f"""question: {{ en: "{item}", hi: "TODO(verify): validated Hindi translation" }},
      field: "phq9_item_{i+1}",
      type: "segmented",
      options: [
        {{ value: "0", label: {{ en: "Not at all", hi: "TODO(verify): validated Hindi translation" }} }},
        {{ value: "1", label: {{ en: "Several days", hi: "TODO(verify): validated Hindi translation" }} }},
        {{ value: "2", label: {{ en: "More than half the days", hi: "TODO(verify): validated Hindi translation" }} }},
        {{ value: "3", label: {{ en: "Nearly every day", hi: "TODO(verify): validated Hindi translation" }} }}
      ],
      required: true,
      whyWeAsk: {{ en: "Somatic and mood parameters directly correlate with overall metabolic stability.", hi: "मनोदशा और शारीरिक मापदंड सीधे तौर पर समग्र चयापचय स्थिरता से संबंधित होते हैं।" }},
      relevance: "high",
      sensitivity: false,
      evidenceNote: {{ en: "Clinical screening parameter.", hi: "नैदानिक ​​स्क्रीनिंग पैरामीटर।" }}
    }}"""
        phq9_questions.append(q)
        
    phq9_replacement = ",\n    ".join(phq9_questions)
    content = re.sub(phq9_pattern, phq9_replacement, content)
    
    # Also fix wording from 2.5
    # mobile_phone_placement
    content = content.replace(
        'question: { en: "Where do you typically carry your mobile phone?", hi: "आप आमतौर पर अपना मोबाइल फोन कहां रखते हैं?" }',
        'question: { en: "How often do you keep a mobile device close to the groin for prolonged periods?", hi: "TODO(verify): validated Hindi translation" }'
    )
    
    # emf_radiation_at_work split into occupational_ionizing_radiation and occupational_rf_exposure
    # Actually wait, doing 2.5 regex replacements might be tricky, let's just do it manually with multi_replace later.
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

update_schema('frontend/src/data/assessmentSchema.js')
update_schema('mobile/src/data/assessmentSchema.js')
