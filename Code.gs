//
// BƯỚC 1: Dán ID của Google Sheet của bạn vào biến `SHEET_ID` bên dưới.
// (Lấy ID từ URL của trang tính: https://docs.google.com/spreadsheets/d/DAY_LA_ID/edit)
//
// BƯỚC 2: Đảm bảo trang tính của bạn có một sheet (tab) tên là "Emails".
// Nếu không có, script sẽ tự tạo ra cho bạn.
//
var SHEET_ID = "YOUR_GOOGLE_SHEET_ID_HERE";
var SHEET_NAME = "Emails";

function doPost(e) {
  var email = "";
  
  // Cố gắng phân tích email từ dữ liệu được gửi lên
  try {
    var requestData = JSON.parse(e.postData.contents);
    if (requestData.email) {
      email = requestData.email;
    }
  } catch (err) {
    // Dự phòng trường hợp dữ liệu được gửi dưới dạng form-data
    if (e.parameter.email) {
      email = e.parameter.email;
    }
  }

  // Kiểm tra email cơ bản
  if (!email || email.indexOf('@') === -1) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "message": "Địa chỉ email không hợp lệ." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var doc = SpreadsheetApp.openById(SHEET_ID);
    var sheet = doc.getSheetByName(SHEET_NAME);
    
    // Nếu sheet không tồn tại, tự động tạo mới với tiêu đề
    if (!sheet) {
      sheet = doc.insertSheet(SHEET_NAME);
      sheet.appendRow(["Timestamp", "Email Address"]);
    }
    
    var timestamp = new Date();
    sheet.appendRow([timestamp, email]);

    // Trả về phản hồi thành công (với tiêu đề CORS)
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "email": email }))
      .setMimeType(ContentService.MimeType.JSON)
      .withHeaders({
        'Access-Control-Allow-Origin': '*',
      });

  } catch (error) {
    // Trả về phản hồi lỗi (với tiêu đề CORS)
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .withHeaders({
        'Access-Control-Allow-Origin': '*',
      });
  }
}

// Hàm xử lý yêu cầu OPTIONS cho CORS Preflight
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .withHeaders({
      'Access-Control-Allow-Origin': '*', // Cho phép mọi tên miền
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
}