from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import cm
import os
from datetime import datetime

class PDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()

    def setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1,  # Center
            fontName='Helvetica-Bold'
        )
        
        self.subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=20,
            fontName='Helvetica-Bold'
        )
        
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=12,
            fontName='Helvetica'
        )

    def create_contract_summary_report(self, contracts: list, output_path: str):
        """Generate contract summary report"""
        doc = SimpleDocTemplate(output_path, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm)
        story = []
        
        # Title
        title = Paragraph("ОТЧЕТ ПО ДОГОВОРАМ АРЕНДЫ", self.title_style)
        story.append(title)
        
        # Date
        date_text = Paragraph(f"Дата формирования: {datetime.now().strftime('%d.%m.%Y')}", self.normal_style)
        story.append(date_text)
        story.append(Spacer(1, 20))
        
        # Summary statistics
        total_contracts = len(contracts)
        active_contracts = len([c for c in contracts if c.status == 'active'])
        total_revenue = sum(c.rental_amount for c in contracts if c.status == 'active')
        
        summary_data = [
            ['Показатель', 'Значение'],
            ['Общее количество договоров', str(total_contracts)],
            ['Активные договоры', str(active_contracts)],
            ['Общая сумма аренды (активные)', f"{total_revenue:,.2f} тенге"]
        ]
        
        summary_table = Table(summary_data, colWidths=[8*cm, 6*cm])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 30))
        
        # Contracts table
        if contracts:
            story.append(Paragraph("СПИСОК ДОГОВОРОВ", self.subtitle_style))
            
            contract_data = [['№ Договора', 'Клиент', 'Адрес', 'Сумма', 'Статус', 'Срок']]
            
            for contract in contracts:
                contract_data.append([
                    contract.contract_number,
                    contract.client_name[:25] + '...' if len(contract.client_name) > 25 else contract.client_name,
                    contract.property_address[:30] + '...' if len(contract.property_address) > 30 else contract.property_address,
                    f"{contract.rental_amount:,.0f}",
                    contract.status,
                    f"{contract.start_date.strftime('%d.%m.%y')} - {contract.end_date.strftime('%d.%m.%y')}"
                ])
            
            contracts_table = Table(contract_data, colWidths=[3*cm, 3.5*cm, 4*cm, 2*cm, 2*cm, 3*cm])
            contracts_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(contracts_table)
        
        doc.build(story)
        return output_path