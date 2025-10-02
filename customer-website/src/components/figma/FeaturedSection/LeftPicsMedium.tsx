import Image from 'next/image';


export default function LeftPicsMedium() {
    return (
        <>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-0 mt-[232px] rounded-[4px] size-[88px]" data-name="Obrazok" data-node-id="18218:9993">
                <Image
                    src="/assets/images/featured-car-blank.png"
                    alt="Car 1"
                    width={88}
                    height={88}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-0 mt-[103.5px] rounded-[4px] size-[113px]" data-name="Obrazok" data-node-id="18218:9994">
                <Image
                    src="/assets/images/featured-car-blank.png"
                    alt="Car 2"
                    width={113}
                    height={113}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-0 mt-0 rounded-[4px] size-[88px]" data-name="Obrazok" data-node-id="18218:9995">
                <Image
                    src="/assets/images/featured-car-blank.png"
                    alt="Car 3"
                    width={88}
                    height={88}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-[128px] mt-[186.5px] rounded-[4px] size-[64px]" data-name="Obrazok" data-node-id="18218:9996">
                <Image
                    src="/assets/images/featured-car-blank.png"
                    alt="Car 4"
                    width={64}
                    height={64}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-[128px] mt-[83.5px] rounded-[4px] size-[88px]" data-name="Obrazok" data-node-id="18218:9997">
                <Image
                    src="/assets/images/featured-car-blank.png"
                    alt="Car 5"
                    width={88}
                    height={88}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
        </>
    );
}