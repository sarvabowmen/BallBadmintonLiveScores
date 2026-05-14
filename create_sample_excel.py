from openpyxl import Workbook

wb = Workbook()
ws = wb.active
ws.title = 'Schedule'
rows = [
    ['Team A', 'Team B', 'Date', 'Time', 'Round'],
    ['Spikers', 'Net Strikers', '2026-06-01', '09:00', 'Qualifier'],
    ['Aces', 'Birdie Blasters', '2026-06-01', '11:00', 'Qualifier'],
    ['Court Kings', 'Power Smashers', '2026-06-01', '13:00', 'Qualifier'],
    ['Spikers', 'Aces', '2026-06-02', '09:00', 'Semi-final'],
    ['Net Strikers', 'Court Kings', '2026-06-02', '11:00', 'Semi-final'],
    ['Birdie Blasters', 'Power Smashers', '2026-06-02', '13:00', 'Quarter-final'],
    ['Spikers', 'Power Smashers', '2026-06-03', '09:00', 'Final'],
    ['Aces', 'Court Kings', '2026-06-03', '11:00', 'Final'],
]
for row in rows:
    ws.append(row)
wb.save('sample-schedule.xlsx')
print('sample-schedule.xlsx created')
