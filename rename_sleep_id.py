for path in [
    'frontend/src/data/assessmentSchema.js',
    'mobile/src/data/assessmentSchema.js',
    'frontend/src/pages/ReportViewer.jsx',
    'backend/tests/test_context_engine.py',
    'backend/tests/test_normalizer.py',
]:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('sleep_quality_psqi_proxy', 'sleep_quality_screening')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated {path}')
