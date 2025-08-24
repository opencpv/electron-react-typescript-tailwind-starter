interface PrintWoucherProps {
  sessionId: string;
  bottles: number;
  cans: number;
}
const printVoucherRequest = async (data: PrintWoucherProps) => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const payload = JSON.stringify({
    phone: data.sessionId,
    bottles: data.bottles,
    cans: data.cans,
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: payload,
  };

  fetch("http://192.168.8.111:8080/print-voucher", requestOptions)
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.error(error));
};

export default printVoucherRequest;
