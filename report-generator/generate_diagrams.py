import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

def generate_system_architecture():
    # Landscape aspect ratio ~10:6
    fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7.5)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    def draw_box(x, y, w, h, title, subtitle="", bg="#f8fafc", border="#334155", lw=1.2):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.12",
                                      facecolor=bg, edgecolor=border, linewidth=lw)
        ax.add_patch(rect)
        if title:
            ax.text(x + w/2, y + h - 0.25, title, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#0f172a')
        if subtitle:
            ax.text(x + w/2, y + h/2 - 0.12, subtitle, ha='center', va='center', fontsize=7.8, color='#334155', linespacing=1.2)

    # 1. Client Layer
    rect_tier1 = patches.FancyBboxPatch((0.4, 5.2), 9.2, 2.1, boxstyle="square,pad=0.05",
                                        facecolor="#ffffff", edgecolor="#0284c7", linewidth=1.5, linestyle='--')
    ax.add_patch(rect_tier1)
    ax.text(0.6, 7.1, "Client Presentation Tier (React 18 + Vite SPA)", fontsize=10, fontweight='bold', color='#0369a1')

    draw_box(0.6, 5.4, 2.0, 1.5, "Facility Overview", "• Real-Time Bento Grid\n• Status Badges\n• Safety Index (98.4%)", bg="#f0f9ff", border="#0284c7")
    draw_box(2.8, 5.4, 2.0, 1.5, "Spline Waveform", "• Live Spline Engine\n• 4s Sensor Heartbeat\n• Warning Limit Line", bg="#f0f9ff", border="#0284c7")
    draw_box(5.0, 5.4, 2.0, 1.5, "Safety Thresholds", "• Dynamic Calibration\n• MAWP Envelopes\n• ESD Ceiling Trip", bg="#f0f9ff", border="#0284c7")
    draw_box(7.2, 5.4, 2.2, 1.5, "Venting & Compliance", "• Remote Vent Console\n• 1-Click Incident Heal\n• NFPA 2 Audit Matrix", bg="#f0f9ff", border="#0284c7")

    # Arrows between Client & API
    ax.annotate("", xy=(2.8, 4.6), xytext=(2.8, 5.2), arrowprops=dict(arrowstyle="<->", color="#0284c7", lw=1.5))
    ax.text(2.7, 4.9, "HTTPS REST Requests", ha='right', va='center', fontsize=7.5, fontweight='bold', color='#0369a1')

    ax.annotate("", xy=(7.2, 4.6), xytext=(7.2, 5.2), arrowprops=dict(arrowstyle="<->", color="#0284c7", lw=1.5))
    ax.text(7.3, 4.9, "Bi-directional WebSockets", ha='left', va='center', fontsize=7.5, fontweight='bold', color='#0369a1')

    # 2. Application & Middleware Tier
    rect_tier2 = patches.FancyBboxPatch((0.4, 2.5), 9.2, 2.1, boxstyle="square,pad=0.05",
                                        facecolor="#ffffff", edgecolor="#059669", linewidth=1.5, linestyle='--')
    ax.add_patch(rect_tier2)
    ax.text(0.6, 4.4, "Application Services & API Gateway (Node.js & Express)", fontsize=10, fontweight='bold', color='#047857')

    draw_box(0.6, 2.7, 2.7, 1.5, "Express REST Controllers", "`/api/overview`, `/api/vessels`\n`/api/telemetry`, `/api/compliance`", bg="#ecfdf5", border="#059669")
    draw_box(3.5, 2.7, 2.9, 1.5, "Emergency Vent Controller", "Actuates virtual solenoid valve\nTriggers rapid pressure release", bg="#ecfdf5", border="#059669")
    draw_box(6.6, 2.7, 2.8, 1.5, "Socket.io Event Dispatcher", "Broadcasts `telemetry:stream`\n`incident:new`, `vessel:update`", bg="#ecfdf5", border="#059669")

    # Arrows between Application & Database
    ax.annotate("", xy=(5.0, 1.9), xytext=(5.0, 2.5), arrowprops=dict(arrowstyle="<->", color="#059669", lw=1.5))
    ax.text(5.1, 2.2, "Mongoose ODM & Reactive Queries", ha='left', va='center', fontsize=8, fontweight='bold', color='#047857')

    # 3. Data Tier
    rect_tier3 = patches.FancyBboxPatch((0.4, 0.2), 9.2, 1.7, boxstyle="square,pad=0.05",
                                        facecolor="#ffffff", edgecolor="#475569", linewidth=1.5, linestyle='--')
    ax.add_patch(rect_tier3)
    ax.text(0.6, 1.7, "Data & Persistence Layer (MongoDB 6.0 Enterprise Database)", fontsize=10, fontweight='bold', color='#334155')

    draw_box(0.6, 0.35, 2.7, 1.2, "Storage Vessels Collection", "• 350 / 700 bar Vessel Roster\n• Cryo Liquid (-253°C) Tanks", bg="#f8fafc", border="#64748b")
    draw_box(3.5, 0.35, 2.9, 1.2, "Telemetry Time-Series Buffer", "• High-Frequency Logs\n• Compound Index (vesselId, time)", bg="#f8fafc", border="#64748b")
    draw_box(6.6, 0.35, 2.8, 1.2, "Audits & Work Orders", "• Safety Alerts & Alarms\n• NFPA 2 / ISO Compliance Logs", bg="#f8fafc", border="#64748b")

    plt.tight_layout()
    plt.savefig('extracted_assets/figure_4_1_system_architecture.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Regenerated figure_4_1_system_architecture.png (compact)")

def generate_class_diagram():
    fig, ax = plt.subplots(figsize=(10, 7.8), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8.5)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    def draw_uml_class(x, y, w, h, title, attrs, methods=None, bg="#f8fafc", border="#1e293b"):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.04,rounding_size=0.08",
                                      facecolor=bg, edgecolor=border, linewidth=1.3)
        ax.add_patch(rect)
        header_h = 0.4
        header_rect = patches.Rectangle((x, y + h - header_h), w, header_h, facecolor="#e2e8f0", edgecolor=border, linewidth=1.3)
        ax.add_patch(header_rect)
        ax.text(x + w/2, y + h - 0.2, title, ha='center', va='center', fontsize=9, fontweight='bold', color='#0f172a')
        
        attr_text = "\n".join(attrs)
        ax.text(x + 0.12, y + h - header_h - 0.1, attr_text, ha='left', va='top', fontsize=7.2, color='#1e293b', fontfamily='monospace', linespacing=1.2)
        
        if methods:
            line_y = y + len(methods)*0.22 + 0.2
            ax.plot([x, x+w], [line_y, line_y], color=border, lw=0.8)
            method_text = "\n".join(methods)
            ax.text(x + 0.12, line_y - 0.1, method_text, ha='left', va='top', fontsize=7.2, color='#0369a1', fontfamily='monospace', linespacing=1.2)

    # 1. Vessel Class
    vessel_attrs = [
        "+vesselId: String",
        "+name: String",
        "+type: Enum (Type IV, Cryo)",
        "+capacityKg: Number",
        "+currentPressureBar: Number",
        "+maxPressureBar: Number",
        "+warningPressureBar: Number",
        "+currentTempC: Number",
        "+lelPercentage: Number",
        "+reliefValveOpen: Boolean",
        "+status: Enum (NOMINAL, CRITICAL)"
    ]
    draw_uml_class(0.5, 3.8, 3.8, 4.4, "Vessel", vessel_attrs, ["+emergencyVentActuate()", "+healBaseline()"], bg="#ffffff", border="#0284c7")

    # 2. Telemetry Class
    telemetry_attrs = [
        "+_id: ObjectId",
        "+vesselId: String",
        "+timestamp: Date",
        "+pressureBar: Number",
        "+tempC: Number",
        "+h2ConcentrationPpm: Number",
        "+lelPercentage: Number",
        "+sensorHealthPercent: Number"
    ]
    draw_uml_class(5.5, 4.8, 4.0, 3.4, "Telemetry", telemetry_attrs, bg="#ffffff", border="#059669")

    # 3. Alert Class
    alert_attrs = [
        "+alertId: String",
        "+vesselId: String",
        "+severity: Enum",
        "+metric: String",
        "+triggerValue: String",
        "+thresholdValue: String",
        "+acknowledged: Boolean",
        "+resolved: Boolean"
    ]
    draw_uml_class(5.5, 0.6, 4.0, 3.6, "Alert / IncidentAlarm", alert_attrs, ["+resolveIncident()"], bg="#ffffff", border="#dc2626")

    # 4. MaintenanceTask Class
    maint_attrs = [
        "+taskId: String",
        "+vesselId: String",
        "+title: String",
        "+checklist: Array",
        "+status: Enum"
    ]
    draw_uml_class(0.5, 0.6, 3.8, 2.6, "MaintenanceTask", maint_attrs, bg="#ffffff", border="#d97706")

    # Relationships
    ax.annotate("", xy=(5.5, 6.5), xytext=(4.3, 6.5), arrowprops=dict(arrowstyle="->", color="#334155", lw=1.3))
    ax.text(4.4, 6.7, "1", fontsize=8.5, fontweight='bold')
    ax.text(5.3, 6.7, "*", fontsize=8.5, fontweight='bold')
    ax.text(4.9, 6.7, "streams", ha='center', fontsize=7.5, style='italic', color='#475569')

    ax.annotate("", xy=(5.5, 2.4), xytext=(4.3, 4.5), arrowprops=dict(arrowstyle="->", color="#334155", lw=1.3))
    ax.text(4.4, 4.6, "1", fontsize=8.5, fontweight='bold')
    ax.text(5.3, 2.6, "*", fontsize=8.5, fontweight='bold')
    ax.text(4.8, 3.6, "triggers", ha='center', fontsize=7.5, style='italic', color='#475569')

    ax.annotate("", xy=(2.4, 3.2), xytext=(2.4, 3.8), arrowprops=dict(arrowstyle="->", color="#334155", lw=1.3))
    ax.text(2.55, 3.6, "1", fontsize=8.5, fontweight='bold')
    ax.text(2.55, 3.3, "*", fontsize=8.5, fontweight='bold')

    plt.tight_layout()
    plt.savefig('extracted_assets/figure_4_2_class_diagram.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Regenerated figure_4_2_class_diagram.png (compact)")

def generate_sequence_diagram():
    fig, ax = plt.subplots(figsize=(10, 7.2), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8.8)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    entities = [
        ("Safety Officer\n(Operator UI)", 1.2),
        ("React Client\n(Vite App)", 3.4),
        ("Express API\nServer", 5.6),
        ("Socket.IO\nRealtime Bus", 7.4),
        ("MongoDB\nDatabase", 9.0)
    ]

    for name, x in entities:
        rect = patches.FancyBboxPatch((x - 0.75, 7.9), 1.5, 0.7, boxstyle="round,pad=0.04",
                                      facecolor="#f1f5f9", edgecolor="#334155", lw=1.1)
        ax.add_patch(rect)
        ax.text(x, 8.25, name, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#0f172a')
        ax.plot([x, x], [0.3, 7.9], color="#94a3b8", lw=1.1, linestyle="--")

    messages = [
        (7.4, 5.6, 7.4, "4s Pulse: emit('telemetry:stream')", "->", "#0284c7"),
        (6.7, 7.4, 3.4, "Broadcast live sensor data", "->", "#0284c7"),
        (6.0, 5.6, 7.4, "Pressure Spike > ESD Limit (694 bar)", "->", "#dc2626"),
        (5.3, 7.4, 3.4, "emit('incident:new') Emergency Alert", "->", "#dc2626"),
        (4.6, 3.4, 1.2, "Red Alert Banner & Sound", "->", "#dc2626"),
        (3.9, 1.2, 3.4, "Click 'Emergency Remote Vent'", "->", "#047857"),
        (3.2, 3.4, 5.6, "POST /api/vent/override {vesselId}", "->", "#047857"),
        (2.5, 5.6, 9.0, "Update: reliefValveOpen=true", "->", "#334155"),
        (1.9, 9.0, 5.6, "Vessel updated, audit logged", "-->", "#64748b"),
        (1.3, 5.6, 7.4, "emit('vent:actuated')", "->", "#0284c7"),
        (0.7, 7.4, 3.4, "Depressurize to Safe Baseline (280 bar)", "->", "#0284c7")
    ]

    for y, x1, x2, text, style, col in messages:
        ls = "--" if "--" in style else "-"
        ax.annotate("", xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle="->", color=col, lw=1.2, linestyle=ls))
        mid_x = (x1 + x2) / 2
        ax.text(mid_x, y + 0.12, text, ha='center', va='bottom', fontsize=6.8, fontweight='bold', color=col)

    plt.tight_layout()
    plt.savefig('extracted_assets/figure_4_3_sequence_diagram.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Regenerated figure_4_3_sequence_diagram.png (compact)")

if __name__ == '__main__':
    generate_system_architecture()
    generate_class_diagram()
    generate_sequence_diagram()
