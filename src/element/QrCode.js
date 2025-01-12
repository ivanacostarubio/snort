import QRCodeStyling from "qr-code-styling";
import { useEffect, useRef } from "react";

export default function QrCode(props) {
    const qrRef = useRef();

    useEffect(() => {
        if (props.data?.length > 0) {
            let qr = new QRCodeStyling({
                width: props.width || 256,
                height: props.height || 256,
                data: props.data,
                margin: 5,
                type: 'canvas',
                image: props.avatar,
                dotsOptions: {
                    type: 'rounded'
                },
                cornersSquareOptions: {
                    type: 'extra-rounded'
                },
                imageOptions: {
                    crossOrigin: "anonymous"
                }
            });
            qrRef.current.innerHTML = "";
            qr.append(qrRef.current);
            if (props.link) {
                qrRef.current.onclick = function (e) {
                    let elm = document.createElement("a");
                    elm.href = props.link;
                    elm.click();
                }
            }
        } else {
            qrRef.current.innerHTML = "";
        }
    }, [props.data, props.link]);

    return (
        <div className="qr" ref={qrRef}></div>
    );
}