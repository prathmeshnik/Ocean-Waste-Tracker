import pandas as pd
from datetime import datetime
import matplotlib.pyplot as plt
import io
import base64

def generate_trash_summary(detections):
    """
    Generate summary statistics from detection results
    
    Args:
        detections: List of DetectionResult objects
    
    Returns:
        Dictionary with summary statistics
    """
    if not detections:
        return {
            'total_detections': 0,
            'trash_counts': {},
            'average_confidence': 0,
            'detection_dates': []
        }
    
    # Count occurrences of each trash type
    trash_counts = {}
    confidences = []
    dates = []
    
    for detection in detections:
        # Count trash types
        trash_type = detection.trash_type
        if trash_type in trash_counts:
            trash_counts[trash_type] += 1
        else:
            trash_counts[trash_type] = 1
        
        # Collect confidences and dates
        confidences.append(detection.confidence)
        dates.append(detection.detection_date)
    
    # Calculate average confidence
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    
    return {
        'total_detections': len(detections),
        'trash_counts': trash_counts,
        'average_confidence': avg_confidence,
        'detection_dates': dates
    }

def generate_time_series_chart(dates):
    """
    Generate time series chart of detections
    
    Args:
        dates: List of detection dates
    
    Returns:
        Base64 encoded PNG image
    """
    if not dates:
        return None
    
    # Convert to pandas Series for easier date handling
    date_series = pd.Series(dates)
    
    # Count detections by day
    counts_by_day = date_series.dt.date.value_counts().sort_index()
    
    # Create figure and plot
    plt.figure(figsize=(10, 6))
    plt.plot(counts_by_day.index, counts_by_day.values, marker='o', linestyle='-')
    plt.title('Trash Detections Over Time')
    plt.xlabel('Date')
    plt.ylabel('Number of Detections')
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # Save plot to in-memory file
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    
    # Encode to base64 for embedding in HTML
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    plt.close()
    
    return img_base64

def generate_trash_type_chart(trash_counts):
    """
    Generate pie chart of trash types
    
    Args:
        trash_counts: Dictionary with trash type counts
    
    Returns:
        Base64 encoded PNG image
    """
    if not trash_counts:
        return None
    
    # Create figure and plot
    plt.figure(figsize=(10, 8))
    
    # Sort by count (descending)
    sorted_counts = sorted(trash_counts.items(), key=lambda x: x[1], reverse=True)
    labels = [item[0] for item in sorted_counts]
    values = [item[1] for item in sorted_counts]
    
    plt.pie(values, labels=labels, autopct='%1.1f%%', startangle=90)
    plt.title('Distribution of Detected Trash Types')
    plt.axis('equal')
    plt.tight_layout()
    
    # Save plot to in-memory file
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    
    # Encode to base64 for embedding in HTML
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    plt.close()
    
    return img_base64

def generate_excel_report(detections):
    """
    Generate Excel report from detection results
    
    Args:
        detections: List of DetectionResult objects
    
    Returns:
        BytesIO object containing Excel file
    """
    # Create DataFrame from detections
    data = []
    for detection in detections:
        data.append({
            'ID': detection.id,
            'Image Path': detection.image_path,
            'Trash Type': detection.trash_type,
            'Confidence (%)': round(detection.confidence * 100, 2),
            'Detection Date': detection.detection_date.strftime('%Y-%m-%d'),
            'Detection Time': detection.detection_date.strftime('%H:%M:%S')
        })
    
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Trash Detections', index=False)
        
        # Get the xlsxwriter workbook and worksheet objects
        workbook = writer.book
        worksheet = writer.sheets['Trash Detections']
        
        # Add a chart sheet for trash type distribution
        if data:
            # Count trash types
            trash_counts = df['Trash Type'].value_counts()
            
            # Create a separate sheet for trash counts
            trash_counts.to_excel(writer, sheet_name='Trash Summary')
            summary_sheet = writer.sheets['Trash Summary']
            
            # Create a pie chart
            pie_chart = workbook.add_chart({'type': 'pie'})
            pie_chart.add_series({
                'name': 'Trash Distribution',
                'categories': ['Trash Summary', 1, 0, len(trash_counts), 0],
                'values': ['Trash Summary', 1, 1, len(trash_counts), 1],
            })
            pie_chart.set_title({'name': 'Distribution of Trash Types'})
            summary_sheet.insert_chart('D2', pie_chart)
    
    output.seek(0)
    return output
