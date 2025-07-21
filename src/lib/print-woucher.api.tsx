import axios from "axios";

interface PrintWoucherProps {
  phone: string;
  bottles: number;
  cans: number;
}
const printVoucherRequest = async (data: PrintWoucherProps) => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  let payload = JSON.stringify(data);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: payload,
  };

  fetch("http://192.168.8.111:8000/print-voucher", requestOptions)
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.error(error));
};

export default printVoucherRequest;
