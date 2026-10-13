# AltAware Lens — integrated project

This folder combines the uploaded frontend and backend branches. The frontend design is preserved, and live URL submissions call the Django `/audit/run/` endpoint. The sample button still opens illustrative sample data, explicitly labelled as a sample.

## Run on Windows (VS Code terminal / PowerShell)

```powershell
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` and replace `your_key_here` with your actual model API key. **Do not share or commit `.env`.**

```powershell
python manage.py migrate
python manage.py runserver
```

Open http://127.0.0.1:8000/ and enter a public webpage URL. Wait for the audit report.

If PowerShell blocks activation, use Command Prompt with `venv\Scripts\activate.bat` instead.

## Important limitations

- The integration is code-assembled and syntax-checked; a real Gemma 4 request and end-to-end browser scan have not been verified in this environment.
- The backend's model code can fall back to heuristic text when model calls fail; don't describe such results as verified visual AI analysis.
- The original backend permits URL scanning and external image fetching. **Use only locally with trusted URLs. Do not deploy publicly without SSRF protections, request limits, and authentication/rate limiting.**
- Review decisions in the report UI are currently browser-session-only; they do not update the backend database.
- PDF export requires the external jsPDF CDN to load. The backend also has a CSV export endpoint.
- Some JavaScript-rendered images may not be extracted by the backend crawler.
