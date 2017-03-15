var address = self.options.address[0];
if (address[0] != "") {
    $("#addressName").val(address[0]).change();
}
$("#addressLastName").val(address[1]).change();
$("#addressStreet").val(address[2]).change();
$("#postCodeSingle").val(address[3]).change();
$("#addressCity").val(address[4]);


$("#textArea").val(self.options.contents[0][0].toLowerCase()).change();
//domyślna waga paczki - 5kg
$("#pdl\\[0\\]\\.weight").val('5').change();
if (self.options.payment) {
    $('#elem_20').click();
    $('#param_20_4').val(self.options.payment[0][0]).change();
}
$("#addressPhone").val(self.options.phone_number[0][0]).change();
$("#email").val(self.options.email[0][0]).change();




