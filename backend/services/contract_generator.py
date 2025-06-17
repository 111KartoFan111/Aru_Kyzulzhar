from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
import os

class ContractGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.contract_dir = "uploads/contracts"
        os.makedirs(self.contract_dir, exist_ok=True)
        
        # Custom styles
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1,  # Center alignment
            fontName='Helvetica-Bold'
        )
        
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceAfter=12,
            fontName='Helvetica'
        )

    def generate_contract(self, contract):
        """Generate PDF contract document"""
        filename = f"{contract.contract_number}.pdf"
        filepath = os.path.join(self.contract_dir, filename)
        
        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        story = []
        
        # Title
        title = Paragraph("ДОГОВОР АРЕНДЫ НЕДВИЖИМОСТИ", self.title_style)
        story.append(title)
        
        # Contract number and date
        contract_info = Paragraph(
            f"Договор № {contract.contract_number}<br/>"
            f"Дата составления: {datetime.now().strftime('%d.%m.%Y')}",
            self.normal_style
        )
        story.append(contract_info)
        story.append(Spacer(1, 20))
        
        # Company info
        company_info = Paragraph(
            "<b>АРЕНДОДАТЕЛЬ:</b><br/>"
            "ТОО 'Кызыл Жар'<br/>"
            "БИН: 123456789012<br/>"
            "Адрес: г. Алматы, ул. Абая, 123<br/>"
            "Телефон: +7 (727) 123-45-67<br/>"
            "Email: info@kyzylzhar.kz",
            self.normal_style
        )
        story.append(company_info)
        story.append(Spacer(1, 20))
        
        # Client info
        client_info = Paragraph(
            f"<b>АРЕНДАТОР:</b><br/>"
            f"{contract.client_name}<br/>"
            f"Телефон: {contract.client_phone or 'Не указан'}<br/>"
            f"Email: {contract.client_email or 'Не указан'}",
            self.normal_style
        )
        story.append(client_info)
        story.append(Spacer(1, 20))
        
        # Contract details table
        contract_data = [
            ['Параметр', 'Значение'],
            ['Объект аренды', contract.property_address],
            ['Тип недвижимости', contract.property_type],
            ['Арендная плата (месяц)', f"{contract.rental_amount:,.2f} тенге"],
            ['Залоговая сумма', f"{contract.deposit_amount:,.2f} тенге"],
            ['Дата начала аренды', contract.start_date.strftime('%d.%m.%Y')],
            ['Дата окончания аренды', contract.end_date.strftime('%d.%m.%Y')],
            ['Срок аренды', f"{(contract.end_date - contract.start_date).days} дней"]
        ]
        
        contract_table = Table(contract_data, colWidths=[6*cm, 10*cm])
        contract_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        
        story.append(contract_table)
        story.append(Spacer(1, 30))
        
        # Terms and conditions
        terms = Paragraph(
            "<b>УСЛОВИЯ ДОГОВОРА:</b><br/><br/>"
            "1. Арендатор обязуется использовать арендованное имущество исключительно по назначению.<br/>"
            "2. Арендная плата вносится до 10 числа каждого месяца.<br/>"
            "3. Арендатор несет ответственность за сохранность арендованного имущества.<br/>"
            "4. При досрочном расторжении договора залоговая сумма не возвращается.<br/>"
            "5. Все споры решаются в соответствии с законодательством Республики Казахстан.",
            self.normal_style
        )
        story.append(terms)
        story.append(Spacer(1, 30))
        
        # Signatures
        signature_data = [
            ['АРЕНДОДАТЕЛЬ', '', 'АРЕНДАТОР'],
            ['', '', ''],
            ['ТОО "Кызыл Жар"', '', contract.client_name],
            ['', '', ''],
            ['_________________', '', '_________________'],
            ['(подпись, печать)', '', '(подпись)']
        ]
        
        signature_table = Table(signature_data, colWidths=[6*cm, 4*cm, 6*cm])
        signature_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(signature_table)
        
        # Build PDF
        doc.build(story)
        return filepath

    def generate_contract_extension(self, contract, new_end_date):
        """Generate contract extension document"""
        filename = f"{contract.contract_number}_extension.pdf"
        filepath = os.path.join(self.contract_dir, filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        story = []
        
        title = Paragraph("ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ К ДОГОВОРУ АРЕНДЫ", self.title_style)
        story.append(title)
        
        extension_text = Paragraph(
            f"Дополнительное соглашение к договору аренды № {contract.contract_number}<br/><br/>"
            f"Стороны договорились о продлении срока аренды до {new_end_date.strftime('%d.%m.%Y')}.<br/>"
            f"Остальные условия договора остаются без изменений.",
            self.normal_style
        )
        story.append(extension_text)
        
        doc.build(story)
        return filepath