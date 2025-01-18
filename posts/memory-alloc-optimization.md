# Weird XMM shuffle? Memory copy optimization!

During my recent "C coding and subsequent reversing" session I've been experimenting with memory allocations, utilizing standard C functions like `memcpy(`) or WinApi's `RtlCopyMemory`.

Binary was compiled as x64 in VS2022's Release mode. Below, you can see the optimization that was applied, instead of direct `memcpy()` call that I specified in the original code:

<img width="617" alt="image" src="https://github.com/user-attachments/assets/1ce897c9-f092-470f-9313-61b8a62e2661" />

Alright, let's go step by step to understand what is happening here!

```
mov rax, rbx
lea r8, unk_14004080
mov r9d, 2
```

This is the initial setup for subsequent XMM-oriented operations. `unk_14004080` is a previously allocated buffer with `272 bytes` of data to be copied from.
`rax` contains a pointer to the destination address. Address of source buffer is loaded into `r8` via `lea r8, unk_14004080`. Next, `2` is copied into lower `32-bits` of `r9` register to serve as a loop counter.

After that, we enter the main loop of data copy via `xmm` registers, which are `128-bit` registers designed for floating point arithmetics and variety of other data types.

<img width="288" alt="image" src="https://github.com/user-attachments/assets/7a1792e8-fd15-4335-a1b1-4c536c9a2dfe" />

Initial ```lea rax, [rax+80h]``` loads a pointer to `rax+80h` into `rax`. It essentially works as a destination pointer to where the data is being copied to from previously seen `r8`, that holds a pointer to allocated buffer with data.

Next, `movups xmm0, xmmword ptr [r8]` instruction loads `16 bytes (128 bits)` of unaligned data, pointed to in memory by `r8` via `movups` into `xmm0` register. The `xmm0` now holds the first chunk of data. Another set of instrucions:

```
movups xmmword ptr [rax-80h], xmm0
movups xmm1, xmmword ptr [r8+70h]
movups xmmword ptr [rax-70h], xmm1
...
```
is the main body of the loop. `xmm1` and `xmm0` are utilized to fetch for `16 bytes` of data from the allocated buffer's memory address that is being held in `r8` (decreasing it by `10h (16 bytes)` after each `movups` instruction) and copying them into memory pointed to by `rax` (also decreasing the relative address to `rax` by `10h` in each instruction)

This continues for the total of 8 times until data is copied from `r8-10h` to `rax-10h`. Then, `r9` is decreased by `1` and checked if its not zero. 
```
sub r9, 1
jnz short loc_1400010E2
```

If not, the loop will iterate once again. Remember that we have `272 bytes` to copy, each copy instrucion via `xmm0 or xmm1` takes `16 bytes`, so one loop iteration lets us copy `128 bytes`. Therefore, we need two full iterations and the remainder will be copied outside of the loop, as seen below:

<img width="332" alt="image" src="https://github.com/user-attachments/assets/d8c54f90-d741-42d1-990e-207b88a26a40" />

The last set `movups xmm0, xmmword ptr [r8]` and `movups xmmword ptr [rax], xmm0` is utilized to copy the remaining bytes, right in between call to `memset`. `memset` in our case is called to fill the original data buffer with zeroes, as seen by `xor edx, edx` being passed as value.

Hope this explanation will help you whenever you encounter similar disassembly code when reversing malware samples.

