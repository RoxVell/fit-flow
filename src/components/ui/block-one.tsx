'use client';
import Blocks from '@/components/uilayouts/blocks';
import React, { useRef } from 'react';

function BlockOne() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className='fixed inset-0 -z-10 opacity-20 overflow-hidden dark:bg-black bg-white before:absolute before:w-full before:h-full before:bg-linear-to-t dark:before:from-[#070707] before:from-[#dbdbdb] before:z-1'
      ref={containerRef}
    >
      <Blocks
        activeDivsClass='dark:bg-[#131212]  bg-[#9ba1a131]  '
        divClass='dark:border-[#131212] border-[#9ba1a131] '
        classname='w-full'
        containerRef={containerRef}
        activeDivs={{
          0: new Set([2, 8, 14, 22, 28, 35, 41, 48, 53]),
          1: new Set([5, 12, 18, 25, 31, 38, 44, 50, 55]),
          2: new Set([0, 7, 15, 21, 29, 36, 42, 47, 52]),
          3: new Set([4, 11, 17, 24, 32, 39, 46, 51, 54]),
          4: new Set([1, 9, 13, 20, 27, 34, 40, 49, 53]),
          5: new Set([6, 10, 19, 26, 30, 37, 43, 48, 55]),
          6: new Set([3, 8, 16, 23, 28, 35, 45, 50, 52]),
          7: new Set([0, 14, 21, 25, 32, 38, 44, 47, 54]),
          8: new Set([5, 11, 18, 27, 31, 36, 42, 49, 53]),
          9: new Set([2, 9, 15, 22, 29, 34, 41, 48, 51]),
          10: new Set([7, 13, 20, 26, 30, 39, 46, 50, 55]),
          11: new Set([4, 10, 17, 24, 28, 37, 43, 47, 52]),
          12: new Set([1, 8, 16, 23, 31, 35, 40, 49, 54]),
          13: new Set([6, 12, 19, 25, 32, 38, 45, 51, 55]),
          14: new Set([3, 9, 14, 21, 27, 36, 44, 48, 53]),
          15: new Set([0, 11, 18, 22, 29, 34, 42, 47, 52]),
          16: new Set([5, 13, 20, 26, 33, 39, 45, 50, 54]),
          17: new Set([2, 10, 17, 23, 30, 37, 41, 49, 55]),
          18: new Set([7, 14, 19, 25, 31, 36, 44, 48, 52]),
          19: new Set([4, 9, 16, 22, 28, 35, 40, 47, 53]),
        }}
      />
    </div>
  );
}

export default BlockOne;