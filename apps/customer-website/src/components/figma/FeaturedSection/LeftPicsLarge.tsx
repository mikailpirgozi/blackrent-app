import Image from 'next/image';


export default function LeftPicsLarge() {
    return (
        <>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-0 mt-[408px] rounded-[4px] size-[144px]" data-name="Obrazok" data-node-id="18218:9993">
                <Image
                    src="/assets/images/featured-car-1.png"
                    alt="Car 1"
                    width={144}
                    height={144}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-0 mt-[176px] rounded-[4px] size-[200px]" data-name="Obrazok" data-node-id="18218:9994">
                <Image
                    src="/assets/images/featured-car-2.png"
                    alt="Car 2"
                    width={200}
                    height={200}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-0 mt-0 rounded-[4px] size-[144px]" data-name="Obrazok" data-node-id="18218:9995">
                <Image
                    src="/assets/images/featured-car-3.png"
                    alt="Car 3"
                    width={144}
                    height={144}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-[232px] mt-[320px] rounded-[4px] size-[112px]" data-name="Obrazok" data-node-id="18218:9996">
                <Image
                    src="/assets/images/featured-car-4.png"
                    alt="Car 4"
                    width={112}
                    height={112}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-[232px] mt-[144px] rounded-[4px] size-[144px]" data-name="Obrazok" data-node-id="18218:9997">
                <Image
                    src="/assets/images/featured-car-5.png"
                    alt="Car 5"
                    width={144}
                    height={144}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
        </>
    );
}