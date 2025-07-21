import axios from "axios";

interface PrintWoucherProps {
  sessionId: string;
  bottles: number;
  cans: number;
}
const printVoucherRequest = async (data: PrintWoucherProps) => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  let payload = JSON.stringify({
    phone: data.sessionId,
    bottles: data.bottles,
    cans: data.cans,
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: payload,
  };

  fetch("http://localhost:8000/print-voucher", requestOptions)
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.error(error));
};

export default printVoucherRequest;
