#include <stdio.h>
#include <stdint.h>

#define MAXK 20
#define MAXN 80
#define MAXM (MAXK*MAXN)

// Since 80 choose 20 < 2^64, we can get exact counts with 64-bit ints
// (but note that 80 choose 22 >= 2^64)
typedef uint64_t num_t;
// Just index by size_t
typedef size_t index_t;

// a[n][k][m] is the number of ways to choose k numbers from {1..n} that sum to m
num_t a[MAXN+1][MAXK+1][MAXM+1];
// (Note that because we only reference a[n-1] when calculating a[n],
// we only need two (current and previous) 2-dimensional arrays of size
// MAXK+1 by MAXM+1, not a 3-dimensional array, but nowadays the
// memory needed is nothing.)

int main(void)
{
    for (index_t n = 0; n <= MAXN; n++) {
        // For any set (including the empty set for n==0), there is 1
        // way to choose k==0 numbers and get a sum of 0 and no other
        // sum is possible by choosing 0 numbers.
        a[n][0][0] = 1;
        // Now calculate for choosing more than k>0 numbers.
        // We iterate k from 1 to min(n,MAXK).
        // Note that therefore we skip this loop if n==0.
        index_t maxk = (n < MAXK ? n : MAXK);
        for (index_t k = 1; k <= maxk; k++) {
            // maxm could be tighter, but this is already fast enough.
            index_t maxm = n * k;
            for (index_t m = 0; m <= maxm; m++) {
                // Calculate a[n][k][m] by adding the number of ways
                // that do not include n in the sum and the number of
                // ways that do include n in the sum, both of which
                // are already calculated in the array.
                //
                // The number of ways that do not include n is the
                // number of ways to choose k numbers from {1..n-1}
                // that sum to m.
                num_t c = a[n-1][k][m];
                // The number of ways that do include n is the number of
                // ways to choose k-1 numbers from {1..n-1} that sum
                // to m-n, or 0 if m<n.
                if (n <= m)
                    c += a[n-1][k-1][m-n];
                a[n][k][m] = c;
            }
        }
    }
    // Print results, which are a table listing M and the number of
    // ways of choosing MAXK numbers from {1..MAXN} that sum to M
    num_t total = 0;
    num_t *p = a[MAXN][MAXK];
    for (index_t m = 0; m <= MAXM; m++) {
        total += p[m];
        if (p[m] != 0)
            printf("%4zu %19llu\n", m, p[m]);
    }
    // Total number of ways can be checked to equal MAXN choose MAXK
    printf("Sum: %19llu\n", total);
    return 0;
}